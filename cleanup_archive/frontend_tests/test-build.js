const { build } = require('vite');

async function testBuild() {
  try {
    console.log('🚀 Starting Vite build test...');

    const result = await build({
      mode: 'production',
      logLevel: 'info',
      build: {
        emptyOutDir: true,
        rollupOptions: {
          onwarn: (warning, warn) => {
            console.log('⚠️ Warning:', warning.message);
            warn(warning);
          },
        },
      },
    });

    console.log('✅ Build completed successfully');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Build failed with error:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testBuild();
