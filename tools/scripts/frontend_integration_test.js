// Frontend Integration Verification Script
console.log("🔬 Starting Frontend Integration Verification...");

// Function to simulate frontend behavior
async function verifyFrontendIntegration() {
  console.log("📋 Step 1: Testing MLB Props Fetch...");

  try {
    // Test MLB props fetch (what the frontend does first)
    const propsResponse = await fetch(
      "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops"
    );
    const propsData = await propsResponse.json();
    console.log("✅ MLB Props:", propsData?.odds?.length || 0, "props fetched");

    if (!propsData?.odds || propsData.odds.length === 0) {
      console.error("❌ No MLB props available!");
      return;
    }

    // Take first 3 props for testing
    const testProps = propsData.odds.slice(0, 3).map((prop) => ({
      id: prop.event_id + "_" + prop.player_name,
      player: prop.player_name,
      stat: prop.stat_type,
      line: prop.line,
      overOdds: prop.odds,
      underOdds: -prop.odds,
      confidence: prop.confidence,
      sport: "MLB",
      gameTime: prop.start_time,
      pickType: "player_prop",
    }));

    console.log("📋 Step 2: Testing Batch Predictions...");
    console.log("Props to send:", testProps);

    // Test batch predictions (what the frontend should be doing)
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
      console.error(
        "❌ Batch predictions failed:",
        batchResponse.status,
        batchResponse.statusText
      );
      const errorText = await batchResponse.text();
      console.error("Error details:", errorText);
      return;
    }

    const batchData = await batchResponse.json();
    console.log("✅ Batch Predictions Response:", batchData);
    console.log("📊 Predictions received:", batchData.predictions?.length || 0);
    console.log("❌ Errors:", batchData.errors?.length || 0);

    if (batchData.predictions && batchData.predictions.length > 0) {
      console.log("🎯 Sample prediction:", batchData.predictions[0]);
      console.log("✅ Frontend integration should work correctly!");
    } else {
      console.error("❌ No predictions returned from batch endpoint");
    }
  } catch (error) {
    console.error("❌ Integration test failed:", error);
  }
}

// Run the verification
verifyFrontendIntegration()
  .then(() => {
    console.log("🏁 Frontend Integration Verification Complete");
  })
  .catch((error) => {
    console.error("💥 Verification failed with error:", error);
  });
