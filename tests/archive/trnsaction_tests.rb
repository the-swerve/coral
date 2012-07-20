# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe Trnsaction do

	# depends on existing profile and charge
	before :all do
		post '/profiles', {:profile => ProfileFactory.new.valid, :auth => @af.valid}
		last_response.body.should include "profile"
		@pr = Profile.all.last
		post "/profiles/#{@pr.short_id}/charges", {:charge => ChargeFactory.new.valid, :auth => @af.valid}
		last_response.body.should include "charge"
		@cg = Charge.all.last
	end

	let(:tr) {TransactionFactory.new}

	describe 'creating by paying a charge' do
		context 'with valid data' do
			it 'creates a new trnsaction' do
				post "/profiles/#{@pr.short_id}/charges/#{@cg.short_id}/pay", {:auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['transaction'].should_not be_nil
			end
		end

		context 'without valid data' do
			it 'fails' do
				# shouldn't ever fail.
			end
		end
	end # end creating by paying

	describe 'creating by voiding a charge' do
		context 'with valid data' do
			it 'creates a new trnsaction' do
				post "/profiles/#{@pr.short_id}/charges/#{@cg.short_id}/void", {:auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['transaction'].should_not be_nil
			end
		end

		context 'without valid data' do
			it 'fails' do
				# shouldn't ever fail.
			end
		end
	end # end creating

end
