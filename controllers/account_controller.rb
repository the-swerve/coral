require './controllers/application.rb'

class Application < Sinatra::Base

	post '/account' do
		@account = Account.new params
		if @account.save
			json :success => true, :account => @account.as_hash,
				:session_token => @account.generate_session_token
		else
			json :success => false,
				:error => @account.errors.to_hash.first.first.to_s +
					' ' + @account.errors.to_hash.first.second.first.to_s # lol
		end
	end

	put '/account', :auth => :account do
		if @account.update_attributes params[:account]
			json :success => true, :account => @account.as_hash
		else
			json :success => false, :error => @account.errors.to_hash.first.first.to_s + 
				' ' + @account.errors.to_hash.first.second.first.to_s 
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
