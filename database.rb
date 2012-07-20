require 'log_buddy'
require 'mongo_mapper'
require 'uri'

# Heroku database setup:
# 1. Add the MongoHQ add-on
# 2. Click on it to go to the MongoHQ config ui
# 3. Go to database users and add 'name: heroku / pass: deep sea creature'
# 4. Wait a bit. 
# 4. ???
# 5. Dancing break.


class Database

	# All possible environments
	ENVS = ['dev','prod','test']

	def initialize(env)
		# Fall back to dev if given invalid env
		env = 'development' unless ENVS.include? env
		# Set configuration settings
		@config = {
			'test' => {
				'host' => 'localhost',
				'port' => '27017',
				'database' => 'coral_test',
				'logfile' => 'test.log'
			}, 'dev' => {
				'host' => 'localhost',
				'port' => '27017',
				'database' => 'coral_dev',
				'logfile' => 'development.log'
			}, 'prod' => {
				'host' => 'localhost',
				'port' => '27017',
				'database' => 'coral_prod',
				'logfile' => 'production.log'
			}, 'environment' => env
		}
		# Initialize env-specific vars for brevity
		env  = @config['environment']
		host = @config[env]['host']
		port = @config[env]['port']
		name = @config[env]['database']
		log  = @config[env]['logfile']

		# Heroku will supply a 'MONGOHQ_URL' environment variable
		if ENV['MONGOHQ_URL']
			uri = URI.parse(ENV['MONGOHQ_URL'])
			MongoMapper.connection = Mongo::Connection.new(uri.host, uri.port)
			MongoMapper.database = uri.path.gsub(/^\//,'')
			MongoMapper.database.authenticate('heroku', 'deep sea creature')
			MongoMapper.connection.connect
		else # we're in dev
			logger = Logger.new('./log/'+log)
			LogBuddy.init(:logger => logger)
			MongoMapper.connection = Mongo::Connection.new(host,port,:logger => logger)
			MongoMapper.database = name
			MongoMapper.connection.connect
		end
	end

	def clear
		MongoMapper.database.collections.each { |c| c.remove }
	end


end # end class Database
