require 'mongoid'
require 'mongo'
require 'uri'
require 'logger'

# Heroku database setup:
# 1. Add the MongoHQ add-on
# 2. Click on it to go to the MongoHQ config ui
# 3. Go to database users and add 'name: heroku / pass: deep sea creature'
# 4. Wait a bit. 
# 4. ???
# 5. Dancing break.


class Database

	def initialize
		if ENV['MONGOHQ_URL']
			Mongoid.load! './config/db.yml', :production
		else
			Mongoid.load! './config/db.yml', :development
		end
		puts 'HI'
		puts '--==--==--=='
		puts ENV['MONGOHQ_URL']
	end

	def clear
		Mongoid.purge!
	end

end # end class Database
