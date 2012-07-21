# coding: utf-8
require 'colorize'
require 'httparty'
require './database'

# Avoid dupes
DB = Database.new 'dev'
DB.clear

H = HTTParty
R = 'http://localhost:3000'

module Testify 

	def expecting test
		if test
			puts ("☺ : " + @action + ' ' + @path).green
		else
			puts ("☹ ☹ ☹ ☹ ☹ ☹ ☹ ☹\nrequest failed: " + @action + ' ' + @path).red
			puts @req.to_s.red
		end
	end

	def should_create path, creds, data
		@action = 'post' ; @path = path
		data.each do |d|
			@req = H.post R + @path, :query => query
			expecting @req['success'] && @req['account']['email'] == @valid[:email]
		end
	end

	def should_not_create path, credentials, data
		@action = 'post' ; @path = '/account'
		@req = H.post R + @path, :query => @valid
		expecting !@req['success'] && @req['message']
	end

	def view path, credentials, parents
	end

	def update path, credentials, parents
	end

	def delete path, credentials, parents
	end

end
