require './controllers/application.rb'

class Application < Sinatra::Base

	post '/account' do
		@account = Account.new @params
		if @account.save 
			json @account.as_hash.merge(:session_token => @account.generate_session_token)
		else 
			halt 400, @account.first_error 
		end
	end

	put '/account', :auth => :account do
		if @account.update_attributes @params
			json @account.as_hash
		else
			halt 400, @account.first_error
		end
	end

	delete '/account', :auth => :account do
		@account.destroy
		json :success => true, :message => ":'("
	end

	get '/account', :auth => :account do
		json @account.as_hash
	end

end
