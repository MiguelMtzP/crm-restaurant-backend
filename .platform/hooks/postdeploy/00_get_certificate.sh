#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d tiempoextra.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email miguelmtzp92@gmail.com