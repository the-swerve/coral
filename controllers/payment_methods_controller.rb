require './controllers/application.rb'

class Application < Sinatra::Base

	# Payment methods

	post '/profiles/:profile_id/payment_methods/?', :auth => :account do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@payment_method = @profile.payment_methods.build @params
			if @payment_method.save
				json @profile.as_hash
			else
				halt 400, @payment_method.first_error
			end
		else
			halt 400, 'profile not found'
		end
	end

	# for payment methods associated with subscriptions for accounts
	post '/profiles/:profile_id/subscriptions/:subscription_id/payment_methods/?', :auth => :account do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@subscription = @profile.subscriptions.find params['subscription_id']
			if @subscription
				@payment_method = @subscription.payment_methods.build @params
				if @payment_method.save
					json @payment_method.as_hash
				else ; halt 400, @payment_method.first_error ; end
			else ; halt 400, 'subscription not found' ; end
		else ; halt 400, 'profile not found' ; end
	end

	# for payment methods associated with subscriptions for a profile user
	post '/account/:account_id/profiles/:profile_id/subscriptions/:sub_id/payment_methods', :auth => :profile do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@subscription = @profile.subscriptions.find params['subscription_id']
			if @subscription
				@payment_method = @subscription.payment_methods.build @params
				if @payment_method.save
					json @payment_method.as_hash
				else ; halt 400, @payment_method.first_error ; end
			else ; halt 400, 'subscription not found' ; end
		else ; halt 400, 'profile not found' ; end
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

	delete '/profiles/:profile_id/payment_methods/:pm_id', :auth => :account do
		@profile = @account.profiles.find params['profile_id']
		if @profile
			@payment_method = @profile.payment_methods.find params['pm_id']
			if @payment_method
				@payment_method.destroy
				json @profile.as_hash
			else ; halt 400, 'payment method not found' ; end
		else ; halt 400, 'profile not found' ; end
	end

	# Outgoing dashboard (customer dashboard)
	post '/profile/payment_methods/?', :auth => :profile do
		@payment_method = @profile_user.payment_methods.build @params
		if @payment_method.save
			json @profile_user.as_hash
		else
			halt 400, @payment_method.first_error
		end
	end

	delete '/profile/payment_methods/:pm_id', :auth => :profile do
		@payment_method = @profile_user.payment_methods.find params['pm_id']
		if @payment_method
			@payment_method.destroy
			json @profile_user.as_hash
		else ; halt 400, 'payment method not found' ; end
	end
end
