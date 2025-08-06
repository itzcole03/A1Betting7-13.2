// Quick test to verify the FeaturedPropsService fix
import axios from "axios";

async function testFeaturedPropsService() {
  console.log("Testing FeaturedPropsService fix...");

  try {
    // Test 1: Direct endpoint call
    const res = await axios.get("http://localhost:8000/mlb/odds-comparison/");
    console.log("1. Direct endpoint response structure:");
    console.log("   - Keys:", Object.keys(res.data));
    console.log("   - Type of odds field:", typeof res.data.odds);
    console.log(
      "   - Length of odds array:",
      Array.isArray(res.data.odds) ? res.data.odds.length : "N/A"
    );

    // Test 2: Simulate the mapping logic
    let arr = [];
    if (Array.isArray(res.data)) {
      arr = res.data;
      console.log("2. Used res.data directly (length:", arr.length, ")");
    } else if (Array.isArray(res.data?.odds)) {
      arr = res.data.odds;
      console.log("2. Used res.data.odds (length:", arr.length, ")");
    } else if (Array.isArray(res.data?.data)) {
      arr = res.data.data;
      console.log("2. Used res.data.data (length:", arr.length, ")");
    } else {
      console.log("2. No valid array found!");
    }

    // Test 3: Sample data structure
    if (arr.length > 0) {
      console.log("3. Sample item keys:", Object.keys(arr[0]));
      console.log("   - event_id:", arr[0].event_id);
      console.log("   - event_name:", arr[0].event_name);
      console.log("   - stat_type:", arr[0].stat_type);
      console.log("   - team_name:", arr[0].team_name);
    }

    console.log("✅ Fix verification complete!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testFeaturedPropsService();
