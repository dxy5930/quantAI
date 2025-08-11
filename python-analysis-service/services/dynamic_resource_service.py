from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime
import re
import os
import json
import threading

from config import config
from services.qwen_analyzer import QwenAnalyzer
from models.database import SessionLocal
from models.stock_models import StockPrice

class DynamicResourceService:
  """根据用户问题与AI分析上下文，动态生成资源（Markdown或图表）。"""

  def __init__(self):
    self.use_ai_decider = str(os.getenv('USE_AI_DECIDER', 'false')).lower() in ('1', 'true', 'yes')
    self.ai_timeout_ms = int(os.getenv('AI_DECIDER_TIMEOUT_MS', '1200'))  # 1.2s 兜底

  @staticmethod
  def _likely_needs_chart(message: str, context: Dict[str, Any]) -> bool:
    text = (message or '').lower()
    keywords = ['图', '图表', '走势', '趋势', '可视化', '分布', '对比', '统计', 'chart']
    return any(k in text for k in keywords)

  @staticmethod
  def _extract_symbols(message: str) -> List[str]:
    symbols = set()
    symbols.update(re.findall(r'\b\d{6}\b', message or ''))
    symbols.update(re.findall(r'\b[A-Z]{2,6}\b', message or ''))
    return list(symbols)[:5]

  @staticmethod
  def _build_markdown(message: str, analysis_points: List[str]) -> str:
    lines = [
      f"# 分析总结（{datetime.now().strftime('%Y-%m-%d %H:%M')}）",
      "",
      "## 问题概述",
      f"{message.strip() if message else '（无）'}",
      "",
      "## 关键要点",
    ]
    if analysis_points:
      for i, p in enumerate(analysis_points, 1):
        lines.append(f"{i}. {p}")
    else:
      lines.append("- 已完成基础分析，无明显异常")
    lines.extend([
      "",
      "## 建议",
      "- 深入关注相关风险与波动",
      "- 可结合图表进一步观察变化趋势",
      "",
      "> 请在资源列表查看",
    ])
    return "\n".join(lines)

  @staticmethod
  def _build_chart_from_db(symbols: List[str]) -> Dict[str, Any] | None:
    try:
      if not symbols:
        return None
      db = SessionLocal()
      # 取最多3个标的，最近30条收盘价
      pick = symbols[:3]
      series = []
      x_axis = []
      for idx, s in enumerate(pick):
        rows = db.query(StockPrice).filter(StockPrice.symbol == s).order_by(StockPrice.date.desc()).limit(30).all()
        rows = list(reversed(rows))
        if not rows:
          continue
        if not x_axis:
          x_axis = [r.date.strftime('%m-%d') for r in rows]
        series.append({"name": s, "data": [float(r.close_price or 0) for r in rows]})
      db.close()
      if not series:
        return None
      return {"type": "line", "xAxis": x_axis, "series": series}
    except Exception:
      return None

  @staticmethod
  def _build_demo_chart(symbols: List[str]) -> Dict[str, Any]:
    x_axis = [f"T{i}" for i in range(1, 8)]
    base = [1, 3, 2, 5, 4, 6, 7]
    series = []
    if symbols:
      for i, s in enumerate(symbols[:3]):
        shift = i
        series.append({"name": s, "data": [v + shift for v in base]})
    else:
      series.append({"name": "score", "data": base})
    return {
      "type": "line",
      "xAxis": x_axis,
      "series": series,
    }

  def _ai_decide(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    prompt = (
      "你是一个资源决策器。请只输出JSON，不要其他解释。\\n"
      "输入是一段用户问题和上下文，判断是否需要生成Markdown和/或多个图表，并给出可能的标的(symbols)数组。\\n"
      "输出格式: {\\\"needMarkdown\\\":true|false,\\\"needChart\\\":true|false,\\\"symbols\\\":[\\\"AAPL\\\"],\\\"highlights\\\":[\\\"要点1\\\",\\\"要点2\\\"],\\\"reasons\\\": [\\\"原因1\\\"]}\\n"
      "判定规则：\\n"
      "- 如果问题涉及‘数据/回测/走势/趋势/对比/分布/可视化/图/图表’，needChart=true\\n"
      "- 若用户希望总结或结论，needMarkdown=true\\n"
      "- symbols 提取可能的标的代码（可为空）\\n"
      f"用户问题: {message}\\n"
      f"上下文: {json.dumps(context, ensure_ascii=False)}\\n"
    )
    qa = QwenAnalyzer()
    raw = qa.analyze_text(prompt, max_tokens=600)
    try:
      data = json.loads(raw)
      return {
        'needMarkdown': bool(data.get('needMarkdown', True)),
        'needChart': bool(data.get('needChart', False)),
        'symbols': data.get('symbols') or [],
        'highlights': data.get('highlights') or [],
        'reasons': data.get('reasons') or [],
        'decider': 'ai'
      }
    except Exception:
      # 回退默认
      return {
        'needMarkdown': True,
        'needChart': self._likely_needs_chart(message, context),
        'symbols': self._extract_symbols(message),
        'highlights': context.get('highlights') or context.get('bullets') or [],
        'reasons': ['fallback to rule'],
        'decider': 'rule'
      }

  def _rule_decide(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    return {
      'needMarkdown': True,
      'needChart': self._likely_needs_chart(message, context),
      'symbols': self._extract_symbols(message),
      'highlights': context.get('highlights') or context.get('bullets') or [],
      'reasons': ['rule only'],
      'decider': 'rule'
    }

  def _decide_with_timeout(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    result: Dict[str, Any] = {}

    def target():
      nonlocal result
      if self.use_ai_decider:
        result = self._ai_decide(message, context)
      else:
        result = self._rule_decide(message, context)

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout=self.ai_timeout_ms / 1000.0)

    if thread.is_alive() or not result:
      # 超时或异常，回退规则
      result = self._rule_decide(message, context)
    return result

  def generate_and_save(self, *, workflow_id: str, message: str, context: Dict[str, Any], persistence_service) -> None:
    """根据消息与上下文动态生成资源并保存（混合判定+超时回退）。"""
    try:
      decision = self._decide_with_timeout(message, context)
      need_md = bool(decision.get('needMarkdown', True))
      need_chart = bool(decision.get('needChart', False))
      points = decision.get('highlights') or []

      # MD
      if need_md:
        md = self._build_markdown(message, points if isinstance(points, list) else [])
        persistence_service.save_markdown_resource(
          workflow_id,
          title="对话分析总结",
          markdown_content=md,
          step_id="summary",
        )

      # Chart
      if need_chart:
        symbols = decision.get('symbols') or self._extract_symbols(message)
        # 优先真实数据
        chart_payload = self._build_chart_from_db(symbols) or self._build_demo_chart(symbols)
        persistence_service.save_chart_resource(
          workflow_id,
          title="关键指标可视化" if not symbols else f"{', '.join(symbols)} 指标可视化",
          chart_data=chart_payload,
          step_id="summary",
        )

      # 记录决策来源
      try:
        persistence_service.save_message(workflow_id, {
          "messageId": f"resource_decider_{datetime.now().timestamp()}",
          "type": "system",
          "content": f"资源生成决策: {json.dumps({k:v for k,v in decision.items() if k!='highlights'}, ensure_ascii=False)}",
          "status": "info"
        })
      except Exception:
        pass

    except Exception as e:
      try:
        persistence_service.save_message(workflow_id, {
          "messageId": f"auto_resource_err_{datetime.now().timestamp()}",
          "type": "system",
          "content": f"自动生成资源失败: {e}",
          "status": "warning"
        })
      except Exception:
        pass 