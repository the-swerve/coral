require './controllers/application.rb'

class Application < Sinatra::Base

	post '/profiles/:id/charges', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['id'].to_i)
		if @profile
			@charge = @profile.charges.build params[:charge]
			if @charge.save
				json :success => true, :charge => @charge.as_hash
			else
				json :success => false, :errors => @charge.errors.to_hash
			end
		else
			json :success => false, :message => 'not found'
		end
	end

	get '/profiles/:id/charges', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['id'].to_i)
		if @profile
			@charges = @profile.charges.all.reduce({}) {|cs,c| cs.merge({c.name => c.as_hash})}
			json :success => true, :charges => @charges
		else
			json :success => false, :message => 'not found'
		end
	end

	get '/profiles/:profile_id/charges/:charge_id', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
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

	put '/profiles/:profile_id/charges/:charge_id', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@charge = @profile.charges.first(:short_id => params['charge_id'].to_i)
			if @charge
				if @charge.update_attributes params[:charge]
					json :success => true, :charge => @charge.as_hash
				else
					json :success => false, :errors => @charge.errors.to_hash
				end
			else
				json :success => false, :errors => 'charge not found'
			end
		else
			json :success => false, :errors => 'profile not found'
		end
	end

	delete '/profiles/:profile_id/charges/:charge_id', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
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
