pipeline{
    agent any

    environment {
        DEPLOY_DIR = '/var/www/crud-node-next/crud-next-node-frontend'
        APP_NAME = 'crud-frontend'
    }

    parameters{
        choice(name: "VERSION", choices: ["1.0", "2.0", "3.0"], description: "")
        booleanParam(name: "executeTests", defaultValue: true, description: "")
    }

    stages{
        stage("checkout"){
            steps{
                // Clone to Jenkins workspace (has proper permissions)
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
                // Install in workspace
                sh 'npm install'
            }
        }

        stage("build"){
            steps{
                // Build in workspace
                sh 'npm run build'
            }
        }

        stage("deploy"){
            steps{
                sh '''
                    # Create deployment directory
                    mkdir -p ${DEPLOY_DIR}
                    
                    # Sync files (no sudo needed)
                    rsync -av --delete \
                        --exclude 'node_modules' \
                        --exclude '.git' \
                        ${WORKSPACE}/ ${DEPLOY_DIR}/
                    
                    rsync -av ${WORKSPACE}/node_modules ${DEPLOY_DIR}/
                    
                    # Restart PM2
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
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}