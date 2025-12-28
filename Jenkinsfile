pipeline{
    agent any
    
    options {
        disableConcurrentBuilds()
    }

    environment {
        DEPLOY_DIR = '/var/www/crud-node-next/crud-next-node-frontend'
        SERVICE_NAME = 'crud-frontend'
        APP_URL = 'http://103.191.76.205:3001'
        HEALTH_ENDPOINT = '/'
    }

    stages{
        stage('Checkout') {
            steps{
                sh '''
                    echo "📥 Checking out latest code from SCM..."
                    cd ${DEPLOY_DIR}
                    git pull origin main
                '''
            }
        }

        stage('Dependencies') {
            steps{
                sh '''
                    echo "📦 Installing dependencies..."
                    cd ${DEPLOY_DIR}
                    npm install
                '''
            }
        }

        stage('Build') {
            steps{
                sh '''
                    echo "🔨 Building application..."
                    cd ${DEPLOY_DIR}
                    npm run build
                '''
            }
        }

        stage('Deploy') {
            steps{
                sh '''
                    echo "🚀 Deploying application..."
                    sudo systemctl restart ${SERVICE_NAME}
                '''
            }
        }

        stage('Smoke Test') {
            steps{
                script{
                    echo '🔍 Running smoke tests...'
                    sleep(time: 5, unit: 'SECONDS')
                    
                    def maxRetries = 5
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        try {
                            sh """
                                response=\$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL}${HEALTH_ENDPOINT})
                                echo "Smoke test response: \$response"
                                
                                if [ "\$response" -eq "200" ] || [ "\$response" -eq "304" ]; then
                                    echo "✅ Smoke test passed!"
                                    exit 0
                                else
                                    echo "❌ Smoke test failed with status \$response"
                                    exit 1
                                fi
                            """
                            healthCheckPassed = true
                        } catch (Exception e) {
                            retryCount++
                            if (retryCount < maxRetries) {
                                echo "⚠️ Smoke test attempt ${retryCount}/${maxRetries} failed, retrying in 5 seconds..."
                                sleep(time: 5, unit: 'SECONDS')
                            } else {
                                error "❌ Smoke test failed after ${maxRetries} attempts"
                            }
                        }
                    }
                }
            }
        }

        stage('Verify') {
            steps{
                sh '''
                    echo "✅ Verifying deployment..."
                    echo "=========================="
                    
                    echo "Service Status:"
                    sudo systemctl status ${SERVICE_NAME} --no-pager | head -10
                    
                    echo "\nPort Status:"
                    sudo lsof -i :3001 | head -5
                    
                    echo "\nRecent Logs:"
                    sudo journalctl -u ${SERVICE_NAME} -n 10 --no-pager
                    
                    echo "\nDeployed Version:"
                    cd ${DEPLOY_DIR}
                    git log -1 --oneline
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
            echo '===================================='
            echo "🌐 Application: ${APP_URL}"
            echo "📦 Service: ${SERVICE_NAME}"
            echo '===================================='
        }
        failure {
            echo '❌ Pipeline failed!'
            sh '''
                echo "🔍 Troubleshooting Information:"
                echo "==============================="
                
                echo "\nService Logs:"
                sudo journalctl -u ${SERVICE_NAME} -n 50 --no-pager || true
                
                echo "\nService Status:"
                sudo systemctl status ${SERVICE_NAME} --no-pager || true
            '''
        }
        always {
            echo '🧹 Pipeline cleanup completed'
        }
    }
}