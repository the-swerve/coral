require 'sinatra'
require 'mongoid'
require './database'
Dir['./controllers/*.rb'].each {|f| require f}

# Initialize the db

DB = Database.new 'dev'

# Initialize the app

run Application
