require 'sinatra'
require 'mongoid'
require 'balanced'
require './database'
Dir['./controllers/*.rb'].each {|f| require f}

# Initialize the db

DB = Database.new

# Initialize Balanced

Balanced.configure('e9234bfacc5211e1bda6026ba7e239a9')

# Initialize the app

run Application
