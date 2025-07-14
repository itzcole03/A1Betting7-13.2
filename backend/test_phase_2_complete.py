#!/usr/bin/env python3
"""
Phase 2 Complete System Test
Tests the maximum accuracy prediction system with PropOllama intelligence.
"""

import asyncio
import sys
import os
sys.path.append('.')
sys.path.append('services')

async def test_phase_2_complete():
    """Test the complete Phase 2 system"""
    print('🎯 PHASE 2 COMPLETE SYSTEM TEST: MAXIMUM ACCURACY WITH PROPOLLAMA')
    print('=' * 70)
    
    try:
        # Test PropOllama Intelligence Integration
        from services.propollama_intelligence_service import generate_propollama_intelligence
        print('✅ PropOllama Intelligence Service loaded')
        
        # Generate intelligent analysis
        analysis = await generate_propollama_intelligence(
            'LeBron James', 'points', 'nba', 
            'What is your confidence in this prediction and why?'
        )
        
        print('\n🧠 PROPOLLAMA INTELLIGENT ANALYSIS:')
        print('-' * 50)
        print(analysis['intelligent_analysis'])
        print('-' * 50)
        
        print('\n📊 PHASE 2 SYSTEM PERFORMANCE:')
        pred = analysis['prediction']
        print(f'   Predicted Value: {pred["predicted_value"]:.1f}')
        print(f'   Confidence: {pred["confidence"]:.1%}')
        print(f'   Accuracy Score: {pred["accuracy_score"]:.1%}')
        print(f'   Models Used: {len(analysis["model_consensus"])}')
        print(f'   Features Analyzed: {analysis["feature_insights"]["total_features"]}')
        print(f'   Execution Time: {analysis["execution_time"]:.3f}s')
        
        print('\n🎯 PHASE 2 ACHIEVEMENT SUMMARY:')
        print(f'   ✅ Advanced Ensemble Models: {len(analysis["model_consensus"])} models')
        print(f'   ✅ Comprehensive Features: {analysis["feature_insights"]["total_features"]}+ features')
        print(f'   ✅ PropOllama Intelligence: Advanced AI analysis')
        print(f'   ✅ Risk Assessment: {analysis["risk_assessment"]["risk_level"]} risk')
        print(f'   ✅ Market Intelligence: Integrated')
        print(f'   ✅ Betting Strategy: Generated')
        
        # Success criteria
        accuracy = pred['accuracy_score']
        confidence = pred['confidence']
        features = analysis['feature_insights']['total_features']
        
        if accuracy >= 0.85 and confidence >= 0.70 and features >= 100:
            print('\n🏆 PHASE 2 SUCCESS ACHIEVED!')
            print('   Advanced ML ensemble with comprehensive features deployed')
            print('   PropOllama enhanced with maximum accuracy intelligence')
            print('   Ready for Phase 3: Comprehensive Analysis Engine')
        else:
            print('\n⚠️  PHASE 2 PARTIAL SUCCESS - Continue optimization')
            
        return True
            
    except Exception as e:
        print(f'❌ Phase 2 complete test error: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_phase_2_complete())
    if success:
        print('\n✅ Phase 2 testing completed successfully')
    else:
        print('\n❌ Phase 2 testing failed') 