#!/bin/bash

# docker-scripts.sh - Management scripts for SEO Analysis application

case "$1" in
    "build")
        echo "Building Docker images..."
        docker-compose build --no-cache
        ;;
    "build-dev")
        echo "Building development Docker images..."
        docker-compose -f docker-compose.dev.yml build --no-cache
        ;;
    "up")
        echo "Starting production environment..."
        docker-compose up -d
        ;;
    "up-dev")
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "logs")
        echo "Showing logs..."
        docker-compose logs -f
        ;;
    "logs-dev")
        echo "Showing development logs..."
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    "down")
        echo "Stopping all services..."
        docker-compose down
        docker-compose -f docker-compose.dev.yml down
        ;;
    "clean")
        echo "Cleaning up Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -f
        ;;
    "health")
        echo "Checking service health..."
        echo "Backend health:"
        curl -f http://localhost:8000/health || echo "Backend unhealthy"
        echo -e "\nFrontend health:"
        curl -f http://localhost:3000/health || echo "Frontend unhealthy"
        ;;
    "shell-backend")
        echo "Opening backend shell..."
        docker-compose exec backend bash
        ;;
    "shell-frontend")
        echo "Opening frontend shell..."
        docker-compose exec frontend sh
        ;;
    "restart")
        echo "Restarting services..."
        docker-compose restart
        ;;
    *)
        echo "Usage: $0 {build|build-dev|up|up-dev|logs|logs-dev|down|clean|health|shell-backend|shell-frontend|restart}"
        echo ""
        echo "Commands:"
        echo "  build      - Build production images"
        echo "  build-dev  - Build development images"
        echo "  up         - Start production environment"
        echo "  up-dev     - Start development environment"
        echo "  logs       - Show production logs"
        echo "  logs-dev   - Show development logs"
        echo "  down       - Stop all services"
        echo "  clean      - Remove all containers, volumes, and images"
        echo "  health     - Check service health"
        echo "  shell-backend  - Open backend container shell"
        echo "  shell-frontend - Open frontend container shell"
        echo "  restart    - Restart all services"
        exit 1
        ;;
esac