# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe PaymentMethod do

	# depends on profile
	before :all do
		post '/profiles', {:profile => ProfileFactory.new.valid, :auth => @af.valid}
		last_response.body.should include "profile"
		@pr = Profile.all.last
	end

	describe 'creating' do
		context 'with valid data' do
			it 'creates a new payment_method' do
				post "/profiles/#{@pr.short_id}/payment_methods",
					{:payment_method => {}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['payment_method']['name'].should_not be_nil
			end
		end

		context 'without valid data' do
			it 'fails' do
				# hmmm
			end
		end
	end # end creating

	describe 'indexing' do
		it 'returns all payment_methods' do
			get "/profiles/#{@pr.short_id}/payment_methods", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['payment_methods'].size.should == @pr.payment_methods.size
		end
	end # end indexing

	describe 'viewing' do
		it 'returns a payment_method' do
			p = @pr.payment_methods.last
			get "/profiles/#{@pr.short_id}/payment_methods/#{p.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['payment_method']['name'].should == p.name
		end
	end # end viewing

	describe 'updating' do
		context 'with valid data' do
			it 'updates the payment_method' do
				s = @pr.payment_methods.last
				put "/profiles/#{@pr.short_id}/payment_methods/#{s.short_id}", {:payment_method => {}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['payment_method'].should_not be_nil
			end
		end

		context 'without valid data' do
			it 'fails' do
				# hmmm
			end
		end
	end # end updating

	describe 'destroying' do
		it 'removes the payment_method from the db' do
			s = @pr.payment_methods.last
			n = @pr.payment_methods.all.size
			delete "/profiles/#{@pr.short_id}/payment_methods/#{s.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			@pr.payment_methods.all.size.should == n - 1
		end
	end # end destroying

end
