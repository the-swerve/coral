require 'sinatra'
require 'mongoid'
require 'balanced'
require './lib/balanced'
require './database'
Dir['./controllers/*.rb'].each {|f| require f}

# Initialize the db

DB = Database.new

# Initialize the app

run Application
