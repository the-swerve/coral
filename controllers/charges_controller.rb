require './controllers/application.rb'

class Application < Sinatra::Base

	# Create charge scoped by profile and payment method
	post '/profiles/:profile_id/payment_methods/:pm_id/charges', :auth => :account do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@payment_method = @profile.payment_methods.find params['pm_id']
			if @payment_method
				@charge = @payment_method.charges.build @params
				if @charge.save
					json @charge.as_hash
				else ; halt 400, @charge.first_error ; end
			else ; halt 400, 'payment method not found' ; end
		else ; halt 400, 'profile not found' ; end
	end

	get '/charges', :auth => :account do
		json @account.profiles.all.reduce([]) {|ps,p| ps.concat(p.charges.map(&:as_hash))}
	end

	get '/profiles/:id/charges', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['id'].to_i)
		if @profile
			@charges = @profile.charges.all.reduce({}) {|cs,c| cs.merge({c.name => c.as_hash})}
			json :success => true, :charges => @charges
		else
			json :success => false, :message => 'not found'
		end
	end

	get '/profiles/:profile_id/charges/:charge_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@charge = @profile.charges.first(:short_id => params['charge_id'].to_i)
			if @charge
				json :success => true, :charge => @charge.as_hash
			else
				json :success => false, :errors => 'charge not found'
			end
		else
			json :success => false, :errors => 'profile not found'
		end
	end

	# update charge, scoped by profile
	put '/profiles/:profile_id/charges/:charge_id', :auth => :account do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@charge = @profile.charges.find params['charge_id']
			if @charge
				if @charge.update_attributes @params
					json @charge.as_hash
				else
					halt 400, @charge.first_error
				end
			else
				halt 400, 'charge not found'
			end
		else
			halt 400, 'profile not found'
		end
	end

	delete '/profiles/:profile_id/charges/:charge_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@charge = @profile.charges.first(:short_id => params['charge_id'].to_i)
			if @charge
				@charge.destroy
				json :success => true, :message => ":'("
			else
				json :success => false, :errors => 'charge not found'
			end
		else
			json :success => false, :message => 'profile not found'
		end
	end

end
