# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe Charge do

	# depends on existing profile
	before :all do
		post '/profiles', {:profile => ProfileFactory.new.valid, :auth => @af.valid}
		last_response.body.should include "profile"
		@pr = Profile.all.last
	end

	let(:cg) {ChargeFactory.new}

	describe 'creating' do
		context 'with valid data' do
			it 'creates a new charge' do
				post "/profiles/#{@pr.short_id}/charges", {:charge => cg.valid, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['charge']['name'].should == cg.valid[:name]
			end

			it 'updates profile as overdue if charge is overdue' do
				@pr.charges.last.update_attributes(:state => 'overdue')
				@pr.past_due
				@pr.state.should == 'unpaid'
				@pr.settle
				@pr.state.should == 'paid'
			end
		end

		context 'without valid data' do
			it 'fails' do
				cg.bad_data.each do |d|
					post "/profiles/#{@pr.short_id}/charges", {:charge => d, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == false
					j['errors'].should_not be_empty
				end
			end
		end
	end # end creating

	describe 'indexing' do
		it 'returns all charges' do
			get "/profiles/#{@pr.short_id}/charges", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['charges'].size.should == Charge.all.size
		end
	end # end indexing

	describe 'viewing' do
		it 'returns a charge' do
			c = @pr.charges.last
			get "/profiles/#{@pr.short_id}/charges/#{c.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['charge']['name'].should == c.name
		end
	end # end viewing

	describe 'updating' do
		context 'with valid data' do
			it 'updates the charge' do
				c = @pr.charges.last
				put "/profiles/#{@pr.short_id}/charges/#{c.short_id}", {:charge => {:name => 'new'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['charge']['name'].should == 'new'
			end
		end

		context 'without valid data' do
			it 'fails' do
				c = @pr.charges.last
				cg.bad_data.each do |d|
					put "/profiles/#{@pr.short_id}/charges/#{c.short_id}", {:charge => d, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == false
					j['errors'].should_not be_empty
				end
			end
		end
	end # end updating

	describe 'destroying' do
		it 'removes the charge from the db' do
			c = @pr.charges.last
			n = @pr.charges.all.size
			delete "/profiles/#{@pr.short_id}/charges/#{c.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			@pr.charges.all.size.should == n - 1
		end
	end # end destroying
end
