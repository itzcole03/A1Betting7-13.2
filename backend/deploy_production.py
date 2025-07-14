#!/usr/bin/env python3
"""
A1Betting Production Deployment Script

Automated deployment with SSL, monitoring, and database setup.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProductionDeployer:
    """Handles complete production deployment"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.ssl_dir = Path("/etc/ssl/a1betting")
        self.nginx_dir = Path("/etc/nginx/sites-available")
        self.systemd_dir = Path("/etc/systemd/system")
        
    def run_command(self, command: List[str], check: bool = True) -> subprocess.CompletedProcess:
        """Run a shell command with logging"""
        logger.info(f"Running: {' '.join(command)}")
        try:
            result = subprocess.run(command, check=check, capture_output=True, text=True)
            if result.stdout:
                logger.info(f"Output: {result.stdout}")
            return result
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {e}")
            if e.stderr:
                logger.error(f"Error: {e.stderr}")
            if check:
                raise
            return e
    
    def setup_ssl_certificates(self):
        """Generate SSL certificates for production"""
        logger.info("Setting up SSL certificates...")
        
        # Create SSL directory
        self.ssl_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate self-signed certificate (replace with real certs in production)
        cert_path = self.ssl_dir / "a1betting.crt"
        key_path = self.ssl_dir / "a1betting.key"
        
        if not cert_path.exists():
            self.run_command([
                "openssl", "req", "-x509", "-newkey", "rsa:4096",
                "-keyout", str(key_path),
                "-out", str(cert_path),
                "-days", "365", "-nodes",
                "-subj", "/C=US/ST=State/L=City/O=A1Betting/CN=localhost"
            ])
            
            # Set proper permissions
            os.chmod(key_path, 0o600)
            os.chmod(cert_path, 0o644)
            
        logger.info("SSL certificates configured")
    
    def setup_nginx(self):
        """Configure Nginx reverse proxy"""
        logger.info("Setting up Nginx configuration...")
        
        nginx_config = f"""
server {{
    listen 80;
    listen 443 ssl http2;
    server_name localhost;
    
    ssl_certificate {self.ssl_dir}/a1betting.crt;
    ssl_certificate_key {self.ssl_dir}/a1betting.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # API proxy
    location /api/ {{
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }}
    
    # Frontend static files
    location / {{
        root /var/www/a1betting;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }}
    
    # Health check
    location /health {{
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }}
}}
"""
        
        nginx_file = self.nginx_dir / "a1betting"
        nginx_file.write_text(nginx_config)
        
        # Enable site
        sites_enabled = Path("/etc/nginx/sites-enabled/a1betting")
        if not sites_enabled.exists():
            sites_enabled.symlink_to(nginx_file)
        
        # Test and reload nginx
        self.run_command(["nginx", "-t"])
        self.run_command(["systemctl", "reload", "nginx"])
        
        logger.info("Nginx configuration complete")
    
    def setup_systemd_service(self):
        """Create systemd service for the backend"""
        logger.info("Setting up systemd service...")
        
        service_config = f"""
[Unit]
Description=A1Betting Backend API
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory={self.project_root}
Environment=PATH={self.project_root}/venv/bin
EnvironmentFile={self.project_root}/.env.production
ExecStart={self.project_root}/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""
        
        service_file = self.systemd_dir / "a1betting.service"
        service_file.write_text(service_config)
        
        # Reload systemd and enable service
        self.run_command(["systemctl", "daemon-reload"])
        self.run_command(["systemctl", "enable", "a1betting"])
        
        logger.info("Systemd service configured")
    
    def setup_database(self):
        """Initialize production database"""
        logger.info("Setting up production database...")
        
        # Create database user and database
        db_commands = [
            "CREATE USER a1betting_user WITH PASSWORD 'secure_password_2024';",
            "CREATE DATABASE a1betting_prod OWNER a1betting_user;",
            "GRANT ALL PRIVILEGES ON DATABASE a1betting_prod TO a1betting_user;",
        ]
        
        for cmd in db_commands:
            try:
                self.run_command([
                    "sudo", "-u", "postgres", "psql", "-c", cmd
                ], check=False)
            except Exception:
                logger.warning(f"Database command may have already been executed: {cmd}")
        
        logger.info("Database setup complete")
    
    def install_dependencies(self):
        """Install production dependencies"""
        logger.info("Installing dependencies...")
        
        # Create virtual environment if it doesn't exist
        venv_path = self.project_root / "venv"
        if not venv_path.exists():
            self.run_command([sys.executable, "-m", "venv", str(venv_path)])
        
        # Install requirements
        pip_path = venv_path / "bin" / "pip"
        requirements_file = self.project_root / "requirements_production.txt"
        
        if requirements_file.exists():
            self.run_command([str(pip_path), "install", "-r", str(requirements_file)])
        else:
            logger.warning("requirements_production.txt not found, using requirements.txt")
            self.run_command([str(pip_path), "install", "-r", "requirements.txt"])
        
        logger.info("Dependencies installed")
    
    def setup_monitoring(self):
        """Configure monitoring and logging"""
        logger.info("Setting up monitoring...")
        
        # Create log directory
        log_dir = Path("/var/log/a1betting")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Set proper permissions
        self.run_command(["chown", "-R", "www-data:www-data", str(log_dir)])
        
        # Create logrotate configuration
        logrotate_config = """
/var/log/a1betting/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload a1betting
    endscript
}
"""
        
        logrotate_file = Path("/etc/logrotate.d/a1betting")
        logrotate_file.write_text(logrotate_config)
        
        logger.info("Monitoring setup complete")
    
    def deploy(self):
        """Execute full production deployment"""
        logger.info("Starting A1Betting production deployment...")
        
        try:
            # Check if running as root
            if os.geteuid() != 0:
                logger.error("This script must be run as root for production deployment")
                sys.exit(1)
            
            # Deployment steps
            self.install_dependencies()
            self.setup_database()
            self.setup_ssl_certificates()
            self.setup_nginx()
            self.setup_systemd_service()
            self.setup_monitoring()
            
            # Start services
            self.run_command(["systemctl", "start", "a1betting"])
            self.run_command(["systemctl", "status", "a1betting", "--no-pager"])
            
            logger.info("✅ Production deployment completed successfully!")
            logger.info("🚀 A1Betting is now running at https://localhost")
            logger.info("📊 API documentation: https://localhost/api/docs")
            logger.info("🔍 Health check: https://localhost/health")
            
        except Exception as e:
            logger.error(f"❌ Deployment failed: {e}")
            sys.exit(1)


def main():
    """Main deployment function"""
    deployer = ProductionDeployer()
    deployer.deploy()


if __name__ == "__main__":
    main()