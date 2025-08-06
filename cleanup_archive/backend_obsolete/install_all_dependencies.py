#!/usr/bin/env python3
"""
Comprehensive Dependency Installer for A1Betting Enhanced Backend
Installs all required packages for full ML/AI functionality
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])
        print(f"✅ {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ {package} - Failed to install")
        return False

def main():
    print("🔧 A1Betting Enhanced Backend - Dependency Installer")
    print("=" * 60)

    # Core dependencies for enhanced backend
    core_packages = [
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "numpy>=1.26.0",
        "pandas>=2.1.0",
        "scikit-learn>=1.3.0",
        "requests>=2.31.0",
        "httpx>=0.25.0",
        "python-dotenv>=1.0.0"
    ]

    # ML/AI packages
    ml_packages = [
        "nltk>=3.8.1",
        "xgboost>=2.0.0",
        "lightgbm>=4.1.0",
        "shap>=0.43.0",
        "statsmodels>=0.14.0",
        "ta>=0.10.2"
    ]

    # Optional advanced packages
    advanced_packages = [
        "tensorflow>=2.16.0",
        "torch>=2.1.0",
        "optuna>=3.4.0"
    ]

    print("📦 Installing Core Dependencies...")
    core_success = 0
    for package in core_packages:
        if install_package(package):
            core_success += 1

    print(f"\n📊 Core packages: {core_success}/{len(core_packages)} installed")

    print("\n🧠 Installing ML/AI Dependencies...")
    ml_success = 0
    for package in ml_packages:
        if install_package(package):
            ml_success += 1

    print(f"\n📊 ML packages: {ml_success}/{len(ml_packages)} installed")

    print("\n🚀 Installing Advanced Dependencies (Optional)...")
    advanced_success = 0
    for package in advanced_packages:
        print(f"Installing {package} (this may take a while)...")
        if install_package(package):
            advanced_success += 1

    print(f"\n📊 Advanced packages: {advanced_success}/{len(advanced_packages)} installed")

    # Download NLTK data
    print("\n📚 Downloading NLTK data...")
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('vader_lexicon', quiet=True)
        print("✅ NLTK data downloaded")
    except:
        print("⚠️ NLTK data download failed - will work with basic features")

    total_packages = len(core_packages) + len(ml_packages) + len(advanced_packages)
    total_success = core_success + ml_success + advanced_success

    print("\n" + "="*60)
    print(f"🎯 Installation Complete: {total_success}/{total_packages} packages installed")

    if core_success == len(core_packages):
        print("✅ Core functionality ready")
    if ml_success >= len(ml_packages) - 2:  # Allow 2 failures
        print("✅ ML/AI functionality ready")
    if advanced_success > 0:
        print("✅ Advanced features available")

    print("\n🚀 Ready to run enhanced backend!")
    print("Run: python main_enhanced.py")

if __name__ == "__main__":
    main()
