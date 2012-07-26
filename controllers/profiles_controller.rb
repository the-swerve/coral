require './controllers/application.rb'

class Application < Sinatra::Base

	get '/profiles', :auth => :account do
		json :success => true,
			:profiles => @account.profiles.all.reduce({}) {|ps,p| ps.merge({p.name => p.as_hash})}
	end

	post '/profiles', :auth => :account do
		@profile = @account.profiles.build @params
		if @profile.save
			json @profile.as_hash
		else
			halt 400, @profile.first_error
		end
	end

	# The unauthorized endpoint for allowing random people to sign up for subscriptions
	post '/account/:short_id/profiles' do
		@acct = Account.find(params["short_id"])
		if @acct
			@profile = @acct.profiles.build params[:profile]
			if @profile.save
				json :success => true, :profile => @profile.as_hash,
					:session_token => @profile.generate_session_token
			else
				json :success => false,
					:error => @profile.errors.to_hash.first.first.to_s +
						' ' + @profile.errors.to_hash.first.second.first.to_s # lol
			end
		else
			json :success => false,
				:error => 'account not found'
		end
	end

	put '/profiles/:profile_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params["profile_id"].to_i)
		if @profile
			if @profile.update_attributes params
				json @profile.as_hash
			else
				halt 400, @profile.first_error
			end
		else
			halt 400, 'profile not found'
		end
	end

	get '/profiles/:profile_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params['profile_id'].to_i)
		if @profile
			json :success => true, :profile => @profile.as_hash
		else
			json :success => false, :error => 'profile not found'
		end
	end

	# Profile management

	get '/manage/authorize', :auth => :profile do
		json :success => true, :session_token => @profile.generate_session_token
	end

	put '/manage/subscribe/:plan_id', :auth => :profile do
		@plan = Plan.first(:short_id => params['plan_id'].to_i)
		if @plan
			@subscription = @profile.subscriptions.build(:plan_id => @plan.id)
			if @subscription.save
				json :success => true, :plan => @plan
			else
				json :success => false,
					:error => @subscription.errors.to_hash.first.first.to_s +
						' ' + @subscription.errors.to_hash.first.second.first.to_s # lol
			end
		else
			json :success => false, :message => "plan not found"
		end
	end

	put '/manage/unsubscribe/:subscription_id', :auth => :profile do
		@subscription = @profile.subscriptions.first(:short_id => params['plan_id'].to_i)
		if @subscription
			@subscription.destroy
			json :success => true, :message => 'subscription destroyed'
		else
			json :success => false, :message => "subscription not found"
		end
	end

	delete '/profiles/:short_id', :auth => :account do
		@profile = @account.profiles.first(:short_id => params["short_id"].to_i)
		if @profile
			@profile.destroy
			json :success => true, :message => 'profile destroyed'
		else
			json :success => false, :message => 'not found'
		end
	end
end
