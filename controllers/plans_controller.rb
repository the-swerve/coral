require './controllers/application.rb'

class Application < Sinatra::Base

	post '/plans', :auth => :account do
		@plan = @account.plans.build params[:plan]
		if @plan.save
			json :success => true, :plan => @plan.as_hash
		else
			json :success => false,
				:error => @plan.errors.to_hash.first.first.to_s +
					' ' + @plan.errors.to_hash.first.second.first.to_s # lol
		end
	end

	get '/plans', :auth => :account do
		json @account.plans.reduce({}) {|ps,p| ps.merge({p.name => p.as_hash})}
	end

	get '/plans/:id', :auth => :account do
		@plan = @account.plans.first(:short_id => params['id'].to_i)
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

	put '/plans/:id', :auth => :account do
		@plan = @account.plans.first(:short_id => params['id'].to_i)
		if @plan
			if @plan.update_attributes params[:plan]
				json :success => true, :plan => @plan.as_hash
			else
				json :success => false, :errors => @plan.errors.to_hash
			end
		else
			json :success => false, :errors => 'not found'
		end
	end

	delete '/plans/:id', :auth => :account do
		@plan = @account.plans.first(:short_id => params['id'].to_i)
		if @plan
			@plan.destroy
			json :success => true, :message => ":'("
		else
			json :success => false, :message => 'not found'
		end
	end

end
