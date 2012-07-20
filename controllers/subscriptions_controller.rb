require './controllers/application.rb'

class Application < Sinatra::Base

	# Subscriptions

	post '/profiles/:profile_id/subscriptions', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@subscription = @profile.subscriptions.build params[:subscription]
			if @subscription.save
				json :success => true, :subscription => @subscription.as_hash
			else
				json :success => false, :errors => @subscription.errors.to_hash
			end
		else
			json :success => false, :message => 'profile not found'
		end
	end

	get '/profiles/:profile_id/subscriptions', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@subscriptions = @profile.subscriptions.all.reduce({}) {|ss,s| ss.merge({s.short_id.to_s => s.as_hash})}
			json :success => true, :subscriptions => @subscriptions
		else
			json :success => false, :message => 'profile not found'
		end
	end

	get '/profiles/:profile_id/subscriptions/:subscription_id', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@subscription = @profile.subscriptions.first(:short_id => params['subscription_id'].to_i)
			if @subscription
				json :success => true, :subscription => @subscription.as_hash
			else
				json :success => false, :errors => 'subscription not found'
			end
		else
			json :success => false, :errors => 'profile not found'
		end
	end

	put '/profiles/:profile_id/subscriptions/:subscription_id', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@subscription = @profile.subscriptions.first(:short_id => params['subscription_id'].to_i)
			if @subscription
				if @subscription.update_attributes params[:subscription]
					json :success => true, :subscription => @subscription.as_hash
				else
					json :success => false, :errors => @subscription.errors.to_hash
				end
			else
				json :success => false, :errors => 'subscription not found'
			end
		else
			json :success => false, :errors => 'profile not found'
		end
	end

	delete '/profiles/:profile_id/subscriptions/:subscription_id', :auth => :account do
		@profile = @user.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			@subscription = @profile.subscriptions.where(:short_id => params['subscription_id'].to_i).first
			if @subscription
				@subscription.delete # XXX destroy didn't work because the object is frozen (...?)
				json :success => true, :message => ":'("
			else
				json :success => false, :errors => 'subscription not found'
			end
		else
			json :success => false, :message => 'profile not found'
		end
	end

end
