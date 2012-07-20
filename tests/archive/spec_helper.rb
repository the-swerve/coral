# Rspec configuration

require 'rspec'
require 'json'
require './controller.rb'
require './tests/lib.rb'
require 'active_support/core_ext'
require 'timecop'

# Configure rack server testing environment
require 'rack/test'
set :environment, :test
ENV['RACK_ENV'] = 'test'
def app
	Controller
end

require './database.rb'
Dir["./models/*.rb"].each {|f| require f}

# Initialize the database
DB = Database.new 'test'

RSpec.configure do |c|
  c.include Rack::Test::Methods
	c.before :all do
		DB.clear
		@af = AccountFactory.new
		post '/account', @af.valid
		@ac = Account.last
		@auth = @ac.session_token
	end

end
