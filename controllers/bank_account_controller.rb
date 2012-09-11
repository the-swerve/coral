require './controllers/application.rb'

class Application < Sinatra::Base

	# This post will both create and update. kewl.
	post '/bank_account', :auth => :account do
		if @account.bank_account
			@ba = @account.bank_account
			if @ba.update_attributes @params
				json @ba.as_hash
			else
				halt 400, @ba.first_error
			end
		else
			@ba = @account.build_bank_account @params
			if @account.bank_account.save
				json @ba.as_hash
			else
				halt 400, @ba.first_error
			end
		end
	end

	delete '/bank_account', :auth => :account do
		@ba = @account.bank_account
		@ba.destroy
		# TODO destroy on balanced's server
		json :destroyed => true
	end

	get '/bank_account', :auth => :account do
		@ba = @account.bank_account
		json @ba.as_hash
	end

end
