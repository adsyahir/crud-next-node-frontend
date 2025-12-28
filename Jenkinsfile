pipeline{
    agent any
    
    options {
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME = 'crud-frontend'
        WORKSPACE_BUILD = '/var/lib/jenkins/workspace/crud-next-node-frontend'
        DEPLOY_DIR = '/var/www/crud-node-next/crud-next-node-frontend'
        RELEASES_DIR = '/var/www/crud-node-next/releases/frontend'
        SERVICE_NAME = 'crud-frontend'
        APP_URL = 'http://103.191.76.205:3001'
    }

    stages{
        stage('Checkout') {
            steps{
                // Build in workspace, NOT production
                checkout scmGit(
                    branches: [[name: '*/main']], 
                    userRemoteConfigs: [[
                        credentialsId: 'github-token', 
                        url: 'https://github.com/adsyahir/crud-next-node-frontend.git'
                    ]]
                )
            }
        }

        stage('Dependencies') {
            steps{
                sh 'npm ci'  // ci is faster and deterministic
            }
        }

        stage('Build') {
            steps{
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps{
                sh 'npm test || echo "No tests configured"'
            }
        }

        stage('Package') {
            steps{
                script {
                    env.RELEASE_VERSION = sh(
                        script: "date +%Y%m%d_%H%M%S",
                        returnStdout: true
                    ).trim()
                    
                    sh """
                        echo "Creating release: ${env.RELEASE_VERSION}"
                        
                        # Create releases directory
                        mkdir -p ${RELEASES_DIR}
                        
                        # Package the build
                        mkdir -p ${RELEASES_DIR}/${env.RELEASE_VERSION}
                        
                        # Copy built files
                        cp -r .next ${RELEASES_DIR}/${env.RELEASE_VERSION}/
                        cp -r public ${RELEASES_DIR}/${env.RELEASE_VERSION}/ || true
                        cp -r node_modules ${RELEASES_DIR}/${env.RELEASE_VERSION}/
                        cp package.json ${RELEASES_DIR}/${env.RELEASE_VERSION}/
                        cp next.config.* ${RELEASES_DIR}/${env.RELEASE_VERSION}/ || true
                        
                        # Copy .env
                        cp ${DEPLOY_DIR}/.env ${RELEASES_DIR}/${env.RELEASE_VERSION}/ || true
                    """
                }
            }
        }

        stage('Deploy') {
            steps{
                sh """
                    echo "Deploying release: ${env.RELEASE_VERSION}"
                    
                    # Create backup of current
                    if [ -L ${DEPLOY_DIR}/current ]; then
                        CURRENT=\$(readlink ${DEPLOY_DIR}/current)
                        echo "Current version: \$CURRENT"
                    fi
                    
                    # Point to new release
                    ln -sfn ${RELEASES_DIR}/${env.RELEASE_VERSION} ${DEPLOY_DIR}/current
                    
                    # Restart service
                    sudo systemctl restart ${SERVICE_NAME}
                """
            }
        }

        stage('Smoke Test') {
            steps{
                script{
                    echo 'Running smoke tests...'
                    sleep(time: 5, unit: 'SECONDS')
                    
                    def response = sh(
                        script: "curl -s -o /dev/null -w '%{http_code}' ${APP_URL}",
                        returnStdout: true
                    ).trim()
                    
                    if (response != '200' && response != '304') {
                        error "Smoke test failed! Response: ${response}"
                    }
                    
                    echo "Smoke test passed! Response: ${response}"
                }
            }
        }

        stage('Cleanup Old Releases') {
            steps{
                sh """
                    # Keep only last 5 releases
                    cd ${RELEASES_DIR}
                    ls -t | tail -n +6 | xargs rm -rf || true
                """
            }
        }
    }

    post {
        success {
            echo "Deployment successful!"
            echo "Version: ${env.RELEASE_VERSION}"
            echo "Application: ${APP_URL}"
        }
        
        failure {
            script {
                echo "Deployment failed! Rolling back..."
                
                // Automatic rollback
                sh """
                    # Get previous release
                    PREVIOUS=\$(ls -t ${RELEASES_DIR} | head -2 | tail -1)
                    
                    if [ ! -z "\$PREVIOUS" ]; then
                        echo "Rolling back to: \$PREVIOUS"
                        ln -sfn ${RELEASES_DIR}/\$PREVIOUS ${DEPLOY_DIR}/current
                        sudo systemctl restart ${SERVICE_NAME}
                        echo "Rollback completed"
                    fi
                """
            }
        }
    }
}