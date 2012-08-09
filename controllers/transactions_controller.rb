require './controllers/application.rb'

class Application < Sinatra::Base

	# Transactions

	post '/profiles/:profile_id/charges/:charge_id/pay', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@charge = @profile.charges.first(:short_id => params['charge_id'].to_i)
			if @charge
				@charge.pay
				@transaction = @charge.trnsactions.last
				json :success => true, :transaction => @transaction.as_hash
			else
				json :success => false, :message => 'charge not found'
			end
		else
			json :success => false, :message => 'profile not found'
		end
	end

	post '/profiles/:profile_id/charges/:charge_id/void', :auth => :account do
		@profile = @user.profiles.find params['profile_id']
		if @profile
			@charge = @profile.charges.find params['charge_id']
			if @charge
				@charge.void
				@transaction = @charge.trnsactions.last
				json @profile.as_hash
			else ; halt 400, 'charge not found' ; end
		else ; halt 400, 'profile not found' ; end
	end

end
