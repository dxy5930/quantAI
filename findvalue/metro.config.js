const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    unstable_enableSymlinks: false,
    unstable_enablePackageExports: true,
    // Force metro to resolve all JS extensions
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
  },
  resetCache: true,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
