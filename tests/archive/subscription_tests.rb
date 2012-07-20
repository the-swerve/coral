# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe Subscription do
	
	let(:pl_f) {PlanFactory.new}
	let(:pr_f) {ProfileFactory.new}
	let(:sb_f) { } # SubscriptionFactory if needed

	# depends on existing profile and plan
	before :all do
		post '/profiles', {:profile => pr_f.valid, :auth => @af.valid}
		last_response.body.should include "profile"
		@pr = Profile.all.last
		post '/plans', {:plan => pl_f.valid, :auth => @af.valid}
		last_response.body.should include "plan"
		@pl = Plan.all.last
		post "/profiles/#{@pr.short_id}/subscriptions",
			{:subscription => {:plan_id => @pl.id}, :auth => @af.valid}
		@sb = Subscription.all.last
	end

	describe 'creating' do
		context 'with valid data' do
			it 'creates a new subscription' do
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['subscription']['plan'].should == @pl.name
			end

			it 'correctly updates to paid status' do
				@pr.settle
				@pr.state.should == 'paid'
			end

			context 'has trial period' do
				it 'makes no initial charges' do
					@pr.charges.all.map(&:destroy)
					post "/profiles/#{@pr.short_id}/subscriptions",
						{:subscription => {:plan_id => @pl.id}, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == true
					@pr.subscriptions.all.last.check_dates
					@pr.charges.should be_empty
				end
				it 'makes charges after trial is done' do
					# Travel one day past end of trial period.
					# 1 (amount) + 2 (initial) = 3 (see ./lib.rb)
					Timecop.freeze(DateTime.now + 1.week + 1.day) do
						@pr.settle
						@pr.balance.should == 0
						@pr.charges.all.map(&:amount).sum.should == 3
						@pr.charges.all.map(&:destroy)
					end
				end
			end

			context 'no trial period' do
				it 'makes initial charges immediately' do
					@pl.update_attributes(:trial_length => nil, :trial_type => nil)
					post "/profiles/#{@pr.short_id}/subscriptions",
						{:subscription => {:plan_id => @pl.id}, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == true
					@pr.subscriptions.all.last.check_dates
					# Reset for idempotence
					@pr.balance.should == 3
					@pr.charges.all.map(&:destroy)
					@pl.update_attributes(pl_f.valid)
				end
			end

			it 'makes continuing recurring payments' do
				# Jump past trial
				Timecop.freeze(DateTime.now + 1.week + 1.day) do
					@pr.settle
					@pr.balance.should == 0
					@pr.charges.all.map(&:amount).sum.should == 3
				end
				Timecop.freeze(DateTime.now + 1.week + 1.month) do
					@pr.settle
					@pr.balance.should == 0
					@pr.charges.all.map(&:amount).sum.should == 4
				end
				Timecop.freeze(DateTime.now + 1.week + 2.months) do
					@pr.settle
					@pr.balance.should == 0
					@pr.charges.all.map(&:amount).sum.should == 5
				end
				Timecop.freeze(DateTime.now + 1.week + 6.months) do
					@pr.settle
					@pr.balance.should == 0
					@pr.charges.all.map(&:amount).sum.should == 9
				end
			end
		end

		context 'without valid data' do
			it 'fails' do
				post "/profiles/#{@pr.short_id}/subscriptions",
					{:subscription => {}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == false
			end

			it 'does not subscribe unpaid people' do
				@pr.update_attributes(:state => 'unpaid')
				post "/profiles/#{@pr.short_id}/subscriptions",
					{:subscription => {:plan_id => @pl.id}, :auth => @af.valid}
				j = JSON.parse(last_response.body.to_s)
				j['success'].should == false
				j['errors'].should_not be_nil
				@pr.update_attributes(:state => 'paid')
			end

			it 'does not subscribe person without payment method' do
				@pr.payment_methods.last.destroy
				post "/profiles/#{@pr.short_id}/subscriptions",
					{:subscription => {:plan_id => @pl.id}, :auth => @af.valid}
				j = JSON.parse(last_response.body.to_s)
				j['success'].should == false
				j['errors'].should_not be_nil
				@pr.payment_methods.create
			end
		end
	end # end creating

	describe 'indexing' do
		it 'returns all subscriptions' do
			get "/profiles/#{@pr.short_id}/subscriptions", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['subscriptions'].size.should == @pr.subscriptions.all.size
		end
	end # end indexing

	describe 'viewing' do
		it 'returns a subscription' do
			s = @pr.subscriptions.last
			get "/profiles/#{@pr.short_id}/subscriptions/#{s.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['subscription']['plan'].should == s.plan.name
		end
	end # end viewing

	describe 'updating' do
		context 'with valid data' do
			it 'updates the subscription' do
				s = @pr.subscriptions.last
				put "/profiles/#{@pr.short_id}/subscriptions/#{s.short_id}", {:subscription => {:expiration_date => Date.today + 2.years}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				Date.parse(j['subscription']['expiration_date']).should == Date.today + 2.years
			end
		end

		context 'without valid data' do
			it 'fails' do
				s = @pr.subscriptions.last
				put "/profiles/#{@pr.short_id}/subscriptions/#{s.short_id}", {:subscription => {:plan_id => nil}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == false
				j['errors'].should_not be_empty
			end
		end
	end # end updating

	describe 'destroying' do
		it 'removes the subscription from the db' do
			s = @pr.subscriptions.last
			n = @pr.subscriptions.last.short_id
			delete "/profiles/#{@pr.short_id}/subscriptions/#{s.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			@pr.subscriptions.all.map(&:short_id).should_not include n
		end
	end # end destroying
end
