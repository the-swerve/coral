require './controllers/application.rb'

class Application < Sinatra::Base

	# Payment methods

	post '/profiles/:profile_id/payment_methods/?', :auth => :account do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@payment_method = @profile.payment_methods.build @params
			if @payment_method.save
				json @payment_method.as_hash
			else
				halt 400, @payment_method.first_error
			end
		else
			halt 400, 'profile not found'
		end
	end

	get '/profiles/:profile_id/payment_methods', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@payment_methods = @profile.payment_methods.all.reduce({}) {|ps,p| ps.merge({p.name => p.as_hash})}
			json :success => true, :payment_methods => @payment_methods
		else
			json :success => false, :message => 'not found'
		end
	end

	get '/profiles/:profile_id/payment_methods/:payment_method_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@payment_method = @profile.payment_methods.first(:short_id => params['payment_method_id'].to_i)
			if @payment_method
				json :success => true, :payment_method => @payment_method.as_hash
			else
				json :success => false, :errors => 'payment_method not found'
			end
		else
			json :success => false, :errors => 'profile not found'
		end
	end

	put '/profiles/:profile_id/payment_methods/:payment_method_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@payment_method = @profile.payment_methods.first(:short_id => params['payment_method_id'].to_i)
			if @payment_method
				if @payment_method.update_attributes params[:payment_method]
					json :success => true, :payment_method => @payment_method.as_hash
				else
					json :success => false, :errors => @payment_method.errors.to_hash
				end
			else
				json :success => false, :errors => 'payment_method not found'
			end
		else
			json :success => false, :errors => 'profile not found'
		end
	end

	delete '/profiles/:profile_id/payment_methods/:payment_method_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@payment_method = @profile.payment_methods.first(:short_id => params['payment_method_id'].to_i)
			if @payment_method
				@payment_method.destroy
				json :success => true, :message => ":'("
			else
				json :success => false, :errors => 'payment_method not found'
			end
		else
			json :success => false, :message => 'profile not found'
		end
	end
end
