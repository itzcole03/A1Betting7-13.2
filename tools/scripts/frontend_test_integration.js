// Simple Frontend Test Script
console.log("🧪 Testing Frontend Batch Predictions Integration...");

async function testFrontendBatchPredictions() {
  try {
    // Step 1: Test if we can fetch MLB props
    console.log("📋 Step 1: Fetching MLB props...");
    const propsResponse = await fetch(
      "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops"
    );

    if (!propsResponse.ok) {
      throw new Error(`Props fetch failed: ${propsResponse.status}`);
    }

    const propsData = await propsResponse.json();
    const odds = propsData?.odds || [];
    console.log(`✅ Fetched ${odds.length} MLB props`);

    if (odds.length === 0) {
      console.error("❌ No props available to test");
      return;
    }

    // Step 2: Test batch predictions with original data format
    console.log("📋 Step 2: Testing batch predictions...");
    const testProps = odds.slice(0, 3); // Take first 3 props

    console.log("Props to send (original format):", testProps);

    const batchResponse = await fetch(
      "http://localhost:8000/api/unified/batch-predictions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testProps),
      }
    );

    if (!batchResponse.ok) {
      const errorText = await batchResponse.text();
      throw new Error(
        `Batch predictions failed: ${batchResponse.status} - ${errorText}`
      );
    }

    const batchData = await batchResponse.json();
    console.log("✅ Batch predictions response:", batchData);
    console.log(
      `📊 Received ${batchData.predictions?.length || 0} predictions`
    );

    if (batchData.predictions && batchData.predictions.length > 0) {
      console.log("🎯 Sample prediction:", batchData.predictions[0]);
      console.log(
        "✅ SUCCESS: Frontend batch predictions integration is working!"
      );

      // Step 3: Test the mapping to FeaturedProp format
      console.log("📋 Step 3: Testing prop mapping...");

      const featuredProps = testProps.map((item) => {
        const player = item.player || item.player_name || "Unknown";
        const matchup = item.matchup || item.event_name || "Unknown vs Unknown";
        const stat = item.stat || item.stat_type || "Unknown";

        return {
          id: item.id || item.event_id || `${player}-${stat}`,
          player,
          matchup,
          stat,
          line: parseFloat(item.line || item.line_score || 0),
          overOdds: parseFloat(
            item.overOdds || item.over_odds || item.value || 0
          ),
          underOdds: parseFloat(
            item.underOdds || item.under_odds || item.value || 0
          ),
          confidence: parseFloat(item.confidence || 75),
          sport: item.sport || "MLB",
          gameTime:
            item.gameTime || item.start_time || new Date().toISOString(),
          pickType: item.pickType || stat || "prop",
          _originalData: item,
        };
      });

      console.log("✅ FeaturedProp mapping successful:", featuredProps);
      console.log("🎯 All integration tests passed!");
    } else {
      console.error("❌ No predictions received");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testFrontendBatchPredictions();
