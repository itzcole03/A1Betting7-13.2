"""Runner script to execute bookmaker seeding against the configured DATABASE_URL or local DB."""
import subprocess
import sys

if __name__ == '__main__':
    # Use project python to run CLI
    subprocess.check_call([sys.executable, "-m", "backend.cli.seed_bookmakers"])