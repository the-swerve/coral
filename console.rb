require './database'
Dir['./models/*.rb'].each {|f| require f}

Database.new
