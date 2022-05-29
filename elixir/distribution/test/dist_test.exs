defmodule DistTest do
  use ExUnit.Case
  doctest Dist

  test "greets the world" do
    assert Dist.hello() == :world
  end
end
