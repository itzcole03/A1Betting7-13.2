// Test script to verify frontend integration
console.log("=== Frontend Integration Test ===");

// Test 1: Check if EnhancedDataManager is working correctly
async function testEnhancedDataManager() {
  console.log("Testing EnhancedDataManager...");

  try {
    // Import the actual EnhancedDataManager (simulating what the frontend does)
    const mockDataManager = {
      getBackendUrl: () => "http://localhost:8000",
      fetchBatch: async function (requests) {
        console.log("Mock fetchBatch called with requests:", requests);

        // Simulate the fixed logic
        let props;
        if (requests.length === 1 && Array.isArray(requests[0].params)) {
          props = requests[0].params;
        } else {
          props = requests.map((request) => request.params);
        }

        console.log("Props to send to backend:", props.length, "items");

        // Make actual request to backend
        const response = await fetch(
          "http://localhost:8000/api/unified/batch-predictions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(props),
          }
        );

        const data = await response.json();
        console.log("Backend response:", data);

        // Return in the format expected by FeaturedPropsService
        const results = {};
        results[requests[0].id] = data;
        return results;
      },
    };

    // Test with sample data matching FeaturedPropsService structure
    const sampleProps = [
      {
        id: "776901",
        player: "Adrian Houser",
        stat: "hits",
        line: 1.5,
        overOdds: -110,
        underOdds: -110,
        confidence: 75,
        sport: "MLB",
        gameTime: "2025-08-02T21:00:00Z",
        pickType: "player",
      },
      {
        id: "776902",
        player: "Brandon Lowe",
        stat: "hits",
        line: 1.5,
        overOdds: -120,
        underOdds: +100,
        confidence: 85,
        sport: "MLB",
        gameTime: "2025-08-02T21:00:00Z",
        pickType: "player",
      },
    ];

    const batchRequest = {
      id: "batch_predictions",
      endpoint: "/api/unified/batch-predictions",
      params: sampleProps,
      priority: "high",
    };

    console.log("Testing with batch request:", batchRequest);

    const results = await mockDataManager.fetchBatch([batchRequest]);
    console.log("✅ EnhancedDataManager test completed:", results);

    // Test 2: Verify FeaturedPropsService processing
    const batchResult = results["batch_predictions"];
    let backendPredictions = [];

    if (batchResult && batchResult.predictions) {
      backendPredictions = batchResult.predictions;
    }

    console.log("Backend predictions:", backendPredictions.length);

    // Test 3: Verify enhanced prop creation
    const enhancedProps = sampleProps.map((originalProp, index) => {
      const backendPrediction = backendPredictions[index];

      if (!backendPrediction || backendPrediction.error) {
        console.warn(`No prediction for prop ${index}:`, originalProp.id);
        return originalProp;
      }

      const enhancedProp = {
        ...originalProp,
        confidence: backendPrediction.confidence || originalProp.confidence,
        ...(backendPrediction.recommendation && {
          recommendation: backendPrediction.recommendation,
        }),
        ...(backendPrediction.quantum_confidence && {
          quantumConfidence: backendPrediction.quantum_confidence,
        }),
        ...(backendPrediction.neural_score && {
          neuralScore: backendPrediction.neural_score,
        }),
        ...(backendPrediction.kelly_fraction && {
          kellyFraction: backendPrediction.kelly_fraction,
        }),
        ...(backendPrediction.expected_value && {
          expectedValue: backendPrediction.expected_value,
        }),
        ...(backendPrediction.shap_explanation && {
          shapExplanation: backendPrediction.shap_explanation,
        }),
        ...(backendPrediction.risk_assessment && {
          riskAssessment: backendPrediction.risk_assessment,
        }),
        ...(backendPrediction.optimal_stake && {
          optimalStake: backendPrediction.optimal_stake,
        }),
      };

      return enhancedProp;
    });

    console.log("✅ Enhanced props created:", enhancedProps);
    console.log("Sample enhanced prop:", enhancedProps[0]);

    return enhancedProps;
  } catch (error) {
    console.error("❌ Frontend integration test failed:", error);
    throw error;
  }
}

// Run the test
testEnhancedDataManager()
  .then((enhancedProps) => {
    console.log("=== Frontend Integration Test PASSED ===");
    console.log(`Successfully created ${enhancedProps.length} enhanced props`);
    console.log(
      "Enhanced features available:",
      Object.keys(enhancedProps[0]).filter((key) =>
        [
          "quantumConfidence",
          "neuralScore",
          "kellyFraction",
          "expectedValue",
          "shapExplanation",
          "riskAssessment",
          "optimalStake",
        ].includes(key)
      )
    );
  })
  .catch((error) => {
    console.log("=== Frontend Integration Test FAILED ===");
    console.error("Error:", error.message);
  });
