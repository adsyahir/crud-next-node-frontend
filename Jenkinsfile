pipeline{
    agent any

    environment {
        DEPLOY_DIR = '/var/www/crud-node-next/crud-next-node-frontend'
        SERVICE_NAME = 'crud-frontend'
        APP_URL = 'http://103.191.76.205:3001'
        HEALTH_ENDPOINT = '/'
    }

    stages{
        stage("checkout"){
            steps{
                checkout scmGit(
                    branches: [[name: '*/main']], 
                    userRemoteConfigs: [[
                        credentialsId: 'github-token', 
                        url: 'https://github.com/adsyahir/crud-next-node-frontend.git'
                    ]]
                )
            }
        }

        stage("install"){
            steps{
                sh 'npm install'
            }
        }

        stage("build"){
            steps{
                sh 'npm run build'
            }
        }

        stage("deploy"){
            steps{
                sh '''
                    mkdir -p ${DEPLOY_DIR}
                    
                    # Sync files (preserve .env)
                    rsync -av --delete \
                        --exclude 'node_modules' \
                        --exclude '.git' \
                        --exclude '.env' \
                        ${WORKSPACE}/ ${DEPLOY_DIR}/
                    
                    rsync -av ${WORKSPACE}/node_modules ${DEPLOY_DIR}/
                    
                    # Restart service
                    sudo systemctl restart ${SERVICE_NAME}
                '''
            }
        }

        stage("health check"){
            steps{
                script{
                    echo '🔍 Performing health check...'
                    sleep(time: 10, unit: 'SECONDS')
                    
                    def maxRetries = 5
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        try {
                            sh """
                                response=\$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL}${HEALTH_ENDPOINT})
                                echo "Health check response code: \$response"
                                
                                if [ "\$response" -eq "200" ] || [ "\$response" -eq "304" ]; then
                                    echo "✅ Health check passed!"
                                    exit 0
                                else
                                    echo "❌ Health check failed with status \$response"
                                    exit 1
                                fi
                            """
                            healthCheckPassed = true
                        } catch (Exception e) {
                            retryCount++
                            if (retryCount < maxRetries) {
                                echo "⚠️ Health check attempt ${retryCount} failed, retrying in 5 seconds..."
                                sleep(time: 5, unit: 'SECONDS')
                            } else {
                                error "❌ Health check failed after ${maxRetries} attempts"
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
            echo "🌐 Application is running at: ${APP_URL}"
        }
        failure {
            echo '❌ Pipeline failed!'
            sh '''
                echo "🔍 Checking service logs for errors..."
                sudo journalctl -u ${SERVICE_NAME} -n 50 --no-pager || true
            '''
        }
    }
}