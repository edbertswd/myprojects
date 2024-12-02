package pacman.model.level;

import org.json.simple.JSONObject;
import pacman.model.entity.dynamic.ghost.GhostMode;

import java.util.HashMap;
import java.util.Map;

/**
 * Helper class to read JSONObject to retrieve level configuration details
 */
public class LevelConfigurationReader {

    private final JSONObject levelConfiguration;

    public LevelConfigurationReader(JSONObject levelConfiguration) {
        this.levelConfiguration = levelConfiguration;
    }

    /**
     * Retrieves the player's speed for the level
     *
     * @return the player's speed for the level
     */
    public double getPlayerSpeed() {
        return ((Number) levelConfiguration.get("pacmanSpeed")).doubleValue();
    }

    /**
     * Retrieves the lengths of the ghost modes in seconds
     *
     * @return the lengths of the ghost modes in seconds
     */
    public Map<GhostMode, Integer> getGhostModeLengths() {
        Map<GhostMode, Integer> ghostModeLengths = new HashMap<>();
        JSONObject modeLengthsObject = (JSONObject) levelConfiguration.get("modeLengths");
        ghostModeLengths.put(GhostMode.CHASE, ((Number) modeLengthsObject.get("chase")).intValue());
        ghostModeLengths.put(GhostMode.SCATTER, ((Number) modeLengthsObject.get("scatter")).intValue());
        ghostModeLengths.put(GhostMode.FRIGHTENED, ((Number) modeLengthsObject.get("frightened")).intValue()); //Add FRIGHTENED mode length
        return ghostModeLengths;
    }


    /**
     * Retrieves the speeds of the ghosts for each ghost mode
     *
     * @return the speeds of the ghosts for each ghost mode
     */
    public Map<GhostMode, Double> getGhostSpeeds() {
        Map<GhostMode, Double> ghostSpeeds = new HashMap<>();
        JSONObject ghostSpeed = (JSONObject) levelConfiguration.get("ghostSpeed");
        ghostSpeeds.put(GhostMode.CHASE, ((Number) ghostSpeed.get("chase")).doubleValue());
        ghostSpeeds.put(GhostMode.SCATTER, ((Number) ghostSpeed.get("scatter")).doubleValue());
        ghostSpeeds.put(GhostMode.FRIGHTENED, ((Number) ghostSpeed.get("frightened")).doubleValue()); // Add FRIGHTENED mode speed
        return ghostSpeeds;
    }
}
