FROM elixir:1.13-alpine as elixir
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
RUN mix local.hex --force && mix local.rebar --force
ADD ./mix.exs ./
# ADD ./mix.exs ./mix.lock ./
# RUN mix deps.get --only prod
RUN MIX_ENV=prod mix deps.compile
ADD ./lib/ ./lib/
ADD ./rel/ ./rel/
RUN MIX_ENV=prod mix release
CMD ./_build/prod/rel/dist/bin/dist start
