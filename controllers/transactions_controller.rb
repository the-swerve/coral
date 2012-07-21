require './controllers/application.rb'

class Application < Sinatra::Base

	# Transactions

	@path = '/profiles/:profile_id/charges/:charge_id'

	post @path + '/pay', :auth => :account do
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

	post @path + 'void', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@charge = @profile.charges.first(:short_id => params['charge_id'].to_i)
			if @charge
				@charge.void
				@transaction = @charge.trnsactions.last
				json :success => true, :transaction => @transaction.as_hash
			else
				json :success => false, :message => 'charge not found'
			end
		else
			json :success => false, :message => 'profile not found'
		end
	end

end
