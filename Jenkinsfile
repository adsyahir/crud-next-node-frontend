pipeline{
    agent any

    environment {
        DEPLOY_DIR = '/var/www/crud-node-next/crud-next-node-frontend'
        APP_NAME = 'crud-frontend'
        APP_URL = 'http://localhost:3000'  // Change to your app's URL and port
        HEALTH_ENDPOINT = '/'  // Change to your health endpoint (e.g., /api/health)
    }

    parameters{
        choice(name: "VERSION", choices: ["1.0", "2.0", "3.0"], description: "")
        booleanParam(name: "executeTests", defaultValue: true, description: "")
    }

    stages{
        stage("checkout"){
            steps{
                checkout scmGit(
                    branches: [[name: '*/main']], 
                    extensions: [], 
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
                    
                    rsync -av --delete \
                        --exclude 'node_modules' \
                        --exclude '.git' \
                        ${WORKSPACE}/ ${DEPLOY_DIR}/
                    
                    rsync -av ${WORKSPACE}/node_modules ${DEPLOY_DIR}/
                    
                    cd ${DEPLOY_DIR}
                    
                    if pm2 list | grep -q "${APP_NAME}"; then
                        pm2 reload ${APP_NAME} --update-env
                    else
                        pm2 start npm --name ${APP_NAME} -- start
                    fi
                    
                    pm2 save
                '''
            }
        }

        stage("health check"){
            steps{
                script{
                    echo '🔍 Performing health check...'
                    
                    // Wait for app to start
                    sleep(time: 10, unit: 'SECONDS')
                    
                    // Retry health check up to 5 times
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

        stage("verify pm2 status"){
            steps{
                sh '''
                    echo "📊 PM2 Process Status:"
                    pm2 list
                    
                    echo "\n📝 PM2 App Info:"
                    pm2 info ${APP_NAME}
                    
                    echo "\n📋 Recent Logs:"
                    pm2 logs ${APP_NAME} --lines 20 --nostream
                '''
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
                echo "🔍 Checking PM2 logs for errors..."
                pm2 logs ${APP_NAME} --lines 50 --nostream || true
                
                echo "\n📊 Current PM2 status:"
                pm2 list || true
            '''
        }
        always {
            echo '🧹 Cleaning up workspace...'
        }
    }
}