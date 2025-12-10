require "csv"
require "set"
require "json"
require "geokit"

# This script generates all possible 3-route combinations for the Subwaydle game.
# It finds routes that require exactly 2 transfers (3 routes total) and filters
# them based on quality metrics to ensure interesting and valid puzzles.

# Route patterns for different service types (weekday, weekend, night, accessible)
patterns = {
  "weekday" => ["1", "2", "3", "4", "5", "6", "7", "A1", "A2", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "SI", "FS", "GS", "H"],
  "weekend" => ["1", "2", "3", "4", "5", "6", "7", "A1", "A2", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "SI", "FS", "GS", "H"],
  "night" => ["1", "2", "3", "4", "5", "6", "7", "A1", "A2", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "SI", "FS", "H"],
  "accessible" => ["1", "2", "3", "4", "5", "6", "7", "A1", "A2", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "SI", "FS", "GS", "H"],
}

# Build transfer map: for each station, list all stations you can transfer to
# This allows the algorithm to find valid transfer points between routes
transfers = {}

transfers_csv = File.read('data/common/transfers.txt')
csv = CSV.parse(transfers_csv, headers: true)
csv.each do |row|
  next if row['from_stop_id'] == row['to_stop_id']
  if transfers[row['from_stop_id']]
    transfers[row['from_stop_id']] << row['to_stop_id']
  else
    transfers[row['from_stop_id']] = [row['to_stop_id']]
  end
end

# Helper function to check if a path segment moves forward (prevents invalid backtracking)
# This validates that paths are making progress toward the destination, allowing for:
# - Short backward segments (1-2 stations) necessary for transfers
# - Longer backward segments that still move away from origin and toward destination
# - Curved routes where backward movement on one route is necessary to continue in a different direction
def path_moves_forward?(path, route, route_indices, origin: nil, destination: nil, latlng: nil, previous_paths: [])
  return true if path.length < 2
  
  # Get route indices for stations in the path
  indices = path.map { |station| route_indices[route][station] }.compact
  return false if indices.length < 2
  
  # Check if indices are consistently increasing (forward) or decreasing (backward)
  increasing = indices.each_cons(2).all? { |a, b| b > a }
  decreasing = indices.each_cons(2).all? { |a, b| b < a }
  
  # If moving forward on route, always allow
  return true if increasing
  
  # If moving backward on route, check if it's acceptable
  if decreasing
    # For backward segments, always check if overall direction makes sense
    # Even short segments (1-2 stations) should make geographic sense
    if origin && latlng
      start_station = path.first
      end_station = path.last
      
      # Check if we're moving away from origin (good - means we're progressing)
      dist_from_origin_start = latlng[origin].distance_to(latlng[start_station])
      dist_from_origin_end = latlng[origin].distance_to(latlng[end_station])
      moving_away_from_origin = dist_from_origin_end > dist_from_origin_start
      
      # If we have destination, also check if moving toward it
      if destination
        dist_to_dest_start = latlng[start_station].distance_to(latlng[destination])
        dist_to_dest_end = latlng[end_station].distance_to(latlng[destination])
        moving_toward_dest = dist_to_dest_end < dist_to_dest_start
        
        # Only allow backward segment if it moves away from origin AND toward destination
        return moving_away_from_origin && moving_toward_dest
      elsif previous_paths.any? && previous_paths.length > 0
        # Use previous path segments to better handle curved routes
        # Calculate the "journey endpoint" - the last station we've visited so far
        journey_endpoint = previous_paths.last.last
        
        # For curved routes, a backward segment on the route might still be valid if:
        # 1. It moves away from origin (overall progress)
        # 2. It moves away from where we've been (journey endpoint) - indicates a curve
        dist_from_journey_end_start = latlng[journey_endpoint].distance_to(latlng[start_station])
        dist_from_journey_end_end = latlng[journey_endpoint].distance_to(latlng[end_station])
        moving_away_from_journey_end = dist_from_journey_end_end > dist_from_journey_end_start
        
        # For very short backward segments (adjacent stations), be more strict:
        # Require that it moves away from origin AND away from journey endpoint
        # AND that the distance moved is significant (not just a tiny geographic adjustment)
        if path.length == 2
          # For adjacent station backward movement, require more significant geographic movement
          station_distance = latlng[start_station].distance_to(latlng[end_station])
          # If stations are close (< 0.5 miles), this is likely unnecessary backtracking
          # unless it's moving significantly away from both origin and journey endpoint
          if station_distance < 0.5
            # Require substantial movement away from both points
            origin_movement = dist_from_origin_end - dist_from_origin_start
            journey_movement = dist_from_journey_end_end - dist_from_journey_end_start
            # Both movements should be at least 0.15 miles to be considered valid
            # This ensures we're not just making tiny adjustments but actually progressing
            return moving_away_from_origin && moving_away_from_journey_end && origin_movement > 0.15 && journey_movement > 0.15
          end
        end
        
        # Allow backward segment if moving away from origin AND away from journey endpoint
        # This handles curved routes where going backward on one route is necessary
        # to continue the journey in a different direction
        return moving_away_from_origin && moving_away_from_journey_end
      end
      
      # Without destination or previous paths, only allow if moving away from origin
      return moving_away_from_origin
    end
    
    # If we don't have origin/latlng info, reject backward segments
    return false
  end
  
  # Mixed direction (not consistently increasing or decreasing) - reject
  false
end

patterns.each do |p, routes|
  answers = Set.new
  solutions = {}
  station_stops = {}
  routings = {}
  latlng = {}
  station_boroughs = {}

  # Load station data: which routes serve each station, coordinates, and borough
  stations_csv = File.read('data/common/Stations.csv')
  csv = CSV.parse(stations_csv, headers: true)
  csv.each do |row|
    station_stops[row['GTFS Stop ID']] = []
    latlng[row['GTFS Stop ID']] = Geokit::LatLng.new(row['GTFS Latitude'],row['GTFS Longitude'])
    station_boroughs[row['GTFS Stop ID']] = row['Borough']
  end

  # Load route data: for each route, get the ordered list of stations it serves
  # Also create route_indices map for O(1) lookups (needed for path_moves_forward?)
  route_indices = {}
  routes.each do |r|
    routings[r] = []
    route_indices[r] = {}
    route_csv = File.read("data/#{p}/stops/#{r}.csv")
    csv = CSV.parse(route_csv)
    csv.each_with_index do |row, idx|
      station_stops[row[0]] << r
      routings[r] << row[0]
      route_indices[r][row[0]] = idx
    end
  end

  # Generate all possible 3-route combinations with 2 transfers
  # Algorithm: For each origin station s1 on route r1:
  #   1. Travel along r1 to station s2 (first transfer arrival)
  #   2. Transfer at s2 to route r2 at station t1 (first transfer departure)
  #   3. Travel along r2 to station s3 (second transfer arrival)
  #   4. Transfer at s3 to route r3 at station t2 (second transfer departure)
  #   5. Travel along r3 to destination s4
  station_stops.each do |s1, routes|
    routes.each do |r1|
      i1 = routings[r1].index(s1)

      # Try both directions from origin (forward and backward along the route)
      [routings[r1][i1..-1], routings[r1][0..i1].reverse].each do |subrouting1|
        subrouting1.each_with_index do |s2, i1n|
          next if i1n == 0  # Skip if we haven't moved from origin
          path1 = subrouting1[0..i1n]  # Path from origin to first transfer point
          # Check if path1 moves forward (prevents invalid backtracking)
          next unless path_moves_forward?(path1, r1, route_indices, origin: s1, latlng: latlng, previous_paths: [])
          next_station1 = subrouting1[i1n + 1]

          # Get all possible transfer stations (including the station itself)
          transfers1 = [transfers[s2]].flatten.compact
          transfers1 << s2

          transfers1.each do |t1|
            next if path1.include?(t1)  # Don't backtrack
            station_stops[t1].each do |r2|
              next if r2 == r1  # Must transfer to a different route
              # Skip if r2 could take us directly from origin in fewer stops
              if routings[r2].include?(s1)
                r2_s1_index = routings[r2].index(s1)
                r2_t1_index = routings[r2].index(t1)
                next if (r2_t1_index - r2_s1_index).abs <= i1n
              end
              i2 = routings[r2].index(t1)
              # Try both directions from first transfer
              [routings[r2][i2..-1], routings[r2][0..i2].reverse].each do |subrouting2|
                # Avoid going back to where we just came from
                next if next_station1 && (subrouting2.include?(next_station1) || [transfers[next_station1]].flatten.compact.any? { |s| subrouting2.include?(s) })
                subrouting2.each_with_index do |s3, i2n|
                  next if i2n == 0  # Skip if we haven't moved from first transfer
                  # Don't revisit stations from first route
                  break if subrouting1.include?(s3) || [transfers[s3]].flatten.compact.any? { |s| path1.include?(s) }

                  path2 = subrouting2[0..i2n]
                  # Don't overlap paths
                  next if (path2[1..-1] & path1).any?
                  # Check if path2 moves forward (prevents invalid backtracking)
                  # Use path1 as previous_paths to handle curved routes
                  next unless path_moves_forward?(path2, r2, route_indices, origin: s1, latlng: latlng, previous_paths: [path1])
                  next_station2 = subrouting2[i2n + 1]
                  transfers2 = [transfers[s3]].flatten.compact
                  transfers2 << s3

                  transfers2.each do |t2|
                    next if path1.include?(t2) || path2.include?(t2)  # Don't backtrack
                    station_stops[t2].each do |r3|
                      next if r3 == r2  # Must transfer to a different route
                      next if r3 == r1  # Can't go back to first route
                      # Skip if r3 could take us from first transfer in fewer stops
                      if routings[r3].include?(t1)
                        r3_t1_index = routings[r3].index(t1)
                        r3_t2_index = routings[r3].index(t2)
                        next if (r3_t2_index - r3_t1_index).abs <= i2n
                      end
                      i3 = routings[r3].index(t2)

                      # Try both directions from second transfer
                      [routings[r3][i3..-1], routings[r3][0..i3].reverse].each do |subrouting3|
                        # Avoid going back to where we just came from
                        next if next_station2 && (subrouting3.include?(next_station2) || [transfers[next_station2]].flatten.compact.any? { |s| subrouting3.include?(s) })
                        subrouting3.each_with_index do |s4, i3n|
                          next if i3n == 0  # Skip if we haven't moved from second transfer
                          # Don't revisit any previous stations
                          break if subrouting1.include?(s4) || subrouting2.include?(s4) || [transfers[s4]].flatten.compact.any? { |s| path1.include?(s) } || [transfers[s4]].flatten.compact.any? { |s| path2.include?(s) }

                          path3 = subrouting3[0..i3n]
                          # Don't overlap paths
                          next if (path3[1..-1] & (path1 + path2)).any?
                          # Check if path3 moves forward (prevents invalid backtracking)
                          # Use path1 and path2 as previous_paths to handle curved routes
                          next unless path_moves_forward?(path3, r3, route_indices, origin: s1, destination: s4, latlng: latlng, previous_paths: [path1, path2])

                          # Check if there's a direct route from origin to destination that's shorter
                          # If so, mark this solution as invalid (factor = 100)
                          route_exists_from_begin_to_end = false
                          ([transfers[s1]].flatten.compact + [s1]).each do |ts1|
                            ([transfers[s4]].flatten.compact + [s4]).each do |ts2|
                              station_stops[ts2].each do |sr|
                                if routings[sr].include?(ts1)
                                  one_route_stops = (routings[sr].index(ts1) - routings[sr].index(ts2)).abs
                                  currnet_route_stops = path1.size + path2.size + path3.size - 2
                                  if one_route_stops < currnet_route_stops
                                    route_exists_from_begin_to_end = true
                                  end
                                end
                              end
                            end
                          end

                          # Normalize route names (A1, A2 -> A)
                          combo = [r1, r2, r3].map do |x|
                            if x.start_with?("A")
                              "A"
                            else
                              x
                            end
                          end

                          # Calculate quality metrics for this route combination
                          as_the_crow_flies = latlng[s1].distance_to(latlng[s4])
                          estimated_travel_distance = latlng[s1].distance_to(latlng[s2]) + latlng[s2].distance_to(latlng[t1]) + latlng[t1].distance_to(latlng[s3]) + latlng[s3].distance_to(latlng[t2]) + latlng[t2].distance_to(latlng[s4])
                          travel_distance_factor = estimated_travel_distance / as_the_crow_flies
                          minimum_distance_between_stations = [latlng[s1].distance_to(latlng[s2]), latlng[t1].distance_to(latlng[s3]), latlng[t2].distance_to(latlng[s4])].min

                          progress_samples = []
                          unless as_the_crow_flies.zero?
                            [path1, path2, path3].each do |path|
                              path.each_cons(2) do |from_station, to_station|
                                progress_samples << (latlng[from_station].distance_to(latlng[s4]) - latlng[to_station].distance_to(latlng[s4])) / as_the_crow_flies
                              end
                            end
                          end
                          minimum_distance_progress_factor = progress_samples.min || 0

                          if !answers.include?(combo)
                            # puts "#{s1} #{r1} #{s2}-#{t1} #{r2} #{s3}-#{t2} #{r3} #{as_the_crow_flies} mi vs. #{estimated_travel_distance} mi (#{travel_distance_factor})"
                            answers << combo
                            solutions[combo] = [
                              {
                                origin: s1,
                                first_transfer_arrival: s2,
                                first_transfer_departure: t1,
                                second_transfer_arrival: s3,
                                second_transfer_departure: t2,
                                destination: s4,
                                travel_distance_factor: route_exists_from_begin_to_end ? 100 : travel_distance_factor,
                                minimum_distance_between_stations: minimum_distance_between_stations,
                                minimum_distance_progress_factor: minimum_distance_progress_factor,
                              }
                            ]
                          else
                            solutions[combo] << {
                              origin: s1,
                              first_transfer_arrival: s2,
                              first_transfer_departure: t1,
                              second_transfer_arrival: s3,
                              second_transfer_departure: t2,
                              destination: s4,
                              travel_distance_factor: route_exists_from_begin_to_end ? 100 : travel_distance_factor,
                              minimum_distance_between_stations: minimum_distance_between_stations,
                              minimum_distance_progress_factor: minimum_distance_progress_factor,
                            }
                          end
                        end
                      end
                    end
                  end
                end
              end
            end
          end
        end
      end
    end
  end

  puts "Writing to JSON file - #{answers.size} entries"

  # For each route combination, pick the best solution from all possible origin/destination pairs
  # Quality criteria (in order of preference):
  #   1. No backtracking (minimum_distance_progress_factor >= 0)
  #   2. Reasonable travel distance (travel_distance_factor < threshold)
  #   3. Minimum distance between stations >= 0.50 miles
  picked_solutions = solutions.map { |k, v|
    # Sort by travel_distance_factor and take the top third, then shuffle for variety
    possible_solutions = v.sort_by { |s| s[:travel_distance_factor] }.slice(0, [1, v.size / 3].max).shuffle
    
    # Helper function to determine max travel factor based on solution's boroughs
    # Cross-borough routes naturally have higher travel_distance_factor, so we allow up to 2.0
    # Same-borough routes should be more efficient, so we keep 1.4 threshold
    get_max_factor = lambda { |s|
      orig_borough = station_boroughs[s[:origin]]
      dest_borough = station_boroughs[s[:destination]]
      is_cross_borough = orig_borough && dest_borough && orig_borough != dest_borough
      is_cross_borough ? 2.0 : 1.4
    }
    
    # Prefer solutions with no backtracking (minimum_distance_progress_factor >= 0)
    # If none exist, fall back to the solution with the best (highest) progress factor
    # Check each solution with its own threshold based on whether it's cross-borough
    picked = possible_solutions.find { |s| 
      max_factor = get_max_factor.call(s)
      s[:travel_distance_factor] < max_factor && s[:minimum_distance_between_stations] >= 0.50 && s[:minimum_distance_progress_factor] >= 0 
    } || 
    possible_solutions.sort_by { |s| -s[:minimum_distance_progress_factor] }.find { |s| 
      max_factor = get_max_factor.call(s)
      s[:travel_distance_factor] < max_factor && s[:minimum_distance_between_stations] >= 0.50 
    } ||
    possible_solutions.find { |s|
      max_factor = get_max_factor.call(s)
      s[:travel_distance_factor] < max_factor
    } ||
    possible_solutions.first
    [k.join("-"), picked]
  }.to_h

  # Filter out solutions that don't meet quality thresholds
  # Cross-borough routes: filter if travel_distance_factor >= 2.0
  # Same-borough routes: filter if travel_distance_factor >= 1.4
  # Reject solutions with significant backtracking (minimum_distance_progress_factor < -0.025)
  bad_solutions = picked_solutions.select { |k, v| 
    orig_borough = station_boroughs[v[:origin]]
    dest_borough = station_boroughs[v[:destination]]
    is_cross_borough = orig_borough && dest_borough && orig_borough != dest_borough
    max_factor = is_cross_borough ? 2.0 : 1.4
    v[:travel_distance_factor] >= max_factor || v[:minimum_distance_progress_factor] < -0.025
  }.map { |k, _| k}.map { |k| k.split("-") }

  file = File.open("../src/data/#{p}/answers.json", "w")
  file.puts JSON.pretty_generate((answers.to_a - bad_solutions).shuffle)
  file.close

  # Keep all solutions in solutions.json (including bad ones) so users can still guess them
  # Bad solutions are just excluded from being daily puzzle answers
  file = File.open("../src/data/#{p}/solutions.json", "w")
  file.puts JSON.pretty_generate(picked_solutions)
  file.close
end