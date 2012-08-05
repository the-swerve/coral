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
		env = 'dev' unless ENVS.include? env # Fall back to dev if given invalid env

		# Heroku will supply a 'MONGOHQ_URL' environment variable
		if ENV['MONGOHQ_URL']
			# https://devcenter.heroku.com/articles/mongohq
			db = URI.parse ENV['MONGOHQ_URL']
			db_name = db.path.gsub(/^\//, '')
			@conn = Mongo::Connection.new(db.host, db.port).db(db_name)
			@conn.authenticate(db.user, db.password) # heroku/deep sea creature
			Mongoid.connection.connect
		else # we're in dev
			@conn = Mongo::Connection.new('localhost', 27017).db(env)
		end
		@conn
	end

	def clear
		Mongoid.purge!
	end


end # end class Database
