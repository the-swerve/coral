require './controllers/application.rb'

class Application < Sinatra::Base

	post '/plans/?', :auth => :account do
		@plan = @account.plans.build @params
		if @plan.save
			json @plan.as_hash
		else
			halt 400, @plan.first_error
		end
	end

	get '/plans/?', :auth => :account do
		json @account.plans.reduce({}) {|ps,p| ps.merge({p.name => p.as_hash})}
	end

	get '/plans/:plan_id', :auth => :account do
		@plan = @account.plans.first(:short_id => params[:plan_id].to_i)
		if @plan
			json :success => true, :plan => @plan.as_hash
		else
			json :success => false, :errors => 'not found'
		end
	end

	get '/share/:plan_id', :auth => :account do
		@plan = Plan.all.first(:short_id => params['plan_id'].to_i)
		if @plan
			json :success => true, :plan => @plan.as_hash
		else
			json :success => false, :errors => 'not found'
		end
	end

	put '/plans/:plan_id', :auth => :account do
		@plan = @account.plans.first(:short_id => params['plan_id'].to_i)
		if @plan
			if @plan.update_attributes(@params)
				json @plan.as_hash
			else ; halt 400, @plan.first_error ; end
		else ; halt 400, 'plan not found' ; end
	end

	delete '/plans/:id', :auth => :account do
		@plan = @account.plans.first(:short_id => @params['id'].to_i)
		if @plan
			@plan.destroy
			json :success => true, :message => ":'("
		else
			json :success => false, :message => 'not found'
		end
	end

end
