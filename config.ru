require 'sinatra'
require './database'
Dir['./controllers/*.rb'].each {|f| require f}

DB = Database.new 'dev'

# Initialize the app

run Application
