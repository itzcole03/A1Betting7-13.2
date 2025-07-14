#!/usr/bin/env node

/**
 * Component Feature Analysis Script
 *
 * This script analyzes all UserFriendlyApp and MoneyMaker component variants
 * to identify unique features that might not be present in the main component.
 */

const fs = require('fs');
const path = require('path');

// Component paths to analyze
const COMPONENT_PATHS = [
  'src/components/user-friendly/UserFriendlyApp.tsx',
  'src/components/user-friendly/UserFriendlyApp_Production.tsx',
  'src/components/user-friendly/EnhancedUserFriendlyApp.tsx',
  'src/components/user-friendly/UserFriendlyApp-Complete.tsx',
  'src/components/user-friendly/UserFriendlyApp-Clean.tsx',
  'src/components/user-friendly/UserFriendlyApp_fixed.tsx',
  'src/components/user-friendly/UserFriendlyApp-fixed.tsx',
  'src/components/MoneyMaker/UniversalMoneyMaker.tsx',
  'src/components/MoneyMaker/UltimateMoneyMaker.tsx',
  'src/components/MoneyMaker/CleanMoneyMaker.tsx',
  'src/components/MoneyMaker/ConsolidatedUniversalMoneyMaker.tsx',
  'src/components/MoneyMaker/AdvancedMLDashboard.tsx',
];

/**
 * Extract unique features from component code
 */
function extractFeatures(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const features = {
      imports: [],
      components: [],
      functions: [],
      hooks: [],
      interfaces: [],
      constants: [],
      css_classes: [],
    };

    // Extract imports
    const importMatches = content.match(/import\s+.*?from\s+['"`].*?['"`]/g);
    if (importMatches) {
      features.imports = importMatches.map(imp => imp.trim());
    }

    // Extract component names
    const componentMatches = content.match(/(?:const|function|class)\s+(\w+)(?:\s*[:=]|\s*\()/g);
    if (componentMatches) {
      features.components = componentMatches.map(comp =>
        comp
          .replace(/(?:const|function|class)\s+/, '')
          .replace(/[:=(].*/, '')
          .trim()
      );
    }

    // Extract function names
    const functionMatches = content.match(/(?:const|function)\s+\w+\s*[=:]/g);
    if (functionMatches) {
      features.functions = functionMatches.map(func =>
        func
          .replace(/(?:const|function)\s+/, '')
          .replace(/\s*[=:].*/, '')
          .trim()
      );
    }

    // Extract hooks usage
    const hookMatches = content.match(/use\w+/g);
    if (hookMatches) {
      features.hooks = [...new Set(hookMatches)];
    }

    // Extract interfaces
    const interfaceMatches = content.match(/interface\s+\w+/g);
    if (interfaceMatches) {
      features.interfaces = interfaceMatches.map(int => int.replace('interface ', '').trim());
    }

    // Extract constants
    const constantMatches = content.match(/const\s+[A-Z_][A-Z0-9_]*\s*=/g);
    if (constantMatches) {
      features.constants = constantMatches.map(const_match =>
        const_match
          .replace(/const\s+/, '')
          .replace(/\s*=.*/, '')
          .trim()
      );
    }

    // Extract CSS classes
    const cssMatches = content.match(/className=['"`][^'"`]*['"`]/g);
    if (cssMatches) {
      features.css_classes = [
        ...new Set(
          cssMatches.map(css =>
            css
              .replace(/className=['"`]/, '')
              .replace(/['"`]$/, '')
              .trim()
          )
        ),
      ];
    }

    return features;
  } catch (error) {
    //     console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Compare features across components
 */
function compareFeatures() {
  //   console.log('🔍 Analyzing component features...');

  const allFeatures = {};
  const uniqueFeatures = {};
  const mainComponent = COMPONENT_PATHS[0]; // UserFriendlyApp.tsx

  // Extract features from all components
  COMPONENT_PATHS.forEach(componentPath => {
    const fullPath = path.join(process.cwd(), componentPath);
    const features = extractFeatures(fullPath);

    if (features) {
      allFeatures[componentPath] = features;
      //       console.log(`✅ Analyzed ${componentPath}`);
    } else {
      //       console.log(`❌ Failed to analyze ${componentPath}`);
    }
  });

  //   console.log(`\n📊 Analysis complete. Found ${Object.keys(allFeatures).length} valid components.`);

  // Get main component features
  const mainFeatures = allFeatures[mainComponent];
  if (!mainFeatures) {
    //     console.error('❌ Could not analyze main component');
    return;
  }

  //   console.log('\n🏠 Main component features:');
  //   console.log(`  - Components: ${mainFeatures.components.length}`);
  //   console.log(`  - Functions: ${mainFeatures.functions.length}`);
  //   console.log(`  - Hooks: ${mainFeatures.hooks.length}`);
  //   console.log(`  - Interfaces: ${mainFeatures.interfaces.length}`);
  //   console.log(`  - Constants: ${mainFeatures.constants.length}`);
  //   console.log(`  - CSS Classes: ${mainFeatures.css_classes.length}`);

  // Find unique features in other components
  //   console.log('\n🔍 Finding unique features in variants...');

  Object.keys(allFeatures).forEach(componentPath => {
    if (componentPath === mainComponent) return;

    const features = allFeatures[componentPath];
    const unique = {
      components: features.components.filter(
        comp => !mainFeatures.components.includes(comp) && comp !== 'default'
      ),
      functions: features.functions.filter(func => !mainFeatures.functions.includes(func)),
      hooks: features.hooks.filter(hook => !mainFeatures.hooks.includes(hook)),
      interfaces: features.interfaces.filter(int => !mainFeatures.interfaces.includes(int)),
      css_classes: features.css_classes.filter(
        css => !mainFeatures.css_classes.includes(css) && css.length > 0
      ),
    };

    // Only store if there are unique features
    const hasUniqueFeatures = Object.values(unique).some(arr => arr.length > 0);
    if (hasUniqueFeatures) {
      uniqueFeatures[componentPath] = unique;
    }
  });

  // Report unique features
  if (Object.keys(uniqueFeatures).length === 0) {
    //     console.log('\n✅ No unique features found in variants.');
    //     console.log('   All features are already present in the main component.');
    //     console.log('   Consider consolidating or removing duplicate files.');
  } else {
    //     console.log('\n🎯 Unique features found:');

    Object.keys(uniqueFeatures).forEach(componentPath => {
      const unique = uniqueFeatures[componentPath];
      const fileName = path.basename(componentPath);

      //       console.log(`\n📁 ${fileName}:`);

      if (unique.components.length > 0) {
        //         console.log(`  🧩 Components: ${unique.components.slice(0, 5).join(", ")}${unique.components.length > 5 ? "..." : ""}`);
      }
      if (unique.functions.length > 0) {
        //         console.log(`  ⚡ Functions: ${unique.functions.slice(0, 5).join(", ")}${unique.functions.length > 5 ? "..." : ""}`);
      }
      if (unique.hooks.length > 0) {
        //         console.log(`  🪝 Hooks: ${unique.hooks.slice(0, 5).join(", ")}${unique.hooks.length > 5 ? "..." : ""}`);
      }
      if (unique.interfaces.length > 0) {
        //         console.log(`  📋 Interfaces: ${unique.interfaces.slice(0, 5).join(", ")}${unique.interfaces.length > 5 ? "..." : ""}`);
      }
      if (unique.css_classes.length > 0) {
        //         console.log(`  🎨 CSS Classes: ${unique.css_classes.slice(0, 5).join(", ")}${unique.css_classes.length > 5 ? "..." : ""}`);
      }
      //       console.log('');
    });
  }

  // Summary
  //   console.log('\n📈 Summary:');
  //   console.log(`  📊 Total components analyzed: ${Object.keys(allFeatures).length}`);
  //   console.log(`  🏠 Main component features: ${Object.keys(mainFeatures).reduce((sum, key) => sum + mainFeatures[key].length, 0)}`);
  //   console.log(`  🎯 Components with unique features: ${Object.keys(uniqueFeatures).length}`);
  //   console.log('');

  if (Object.keys(uniqueFeatures).length === 0) {
    //     console.log('💡 Recommendation: Consider consolidating duplicate components.');
    //     console.log('   All functionality appears to be present in the main component.');
  } else {
    //     console.log('💡 Recommendation: Review unique features for potential integration.');
    //     console.log('   Some variants contain features not present in the main component.');
  }
}

// Run the analysis
if (require.main === module) {
  compareFeatures();
}

module.exports = { extractFeatures, compareFeatures };
