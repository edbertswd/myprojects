package pacman.model.entity.dynamic.ghost.GhostType;

import javafx.scene.image.Image;
import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode;
import pacman.model.entity.dynamic.ghost.Strategy.GhostStrategy;
import pacman.model.entity.dynamic.physics.BoundingBox;
import pacman.model.entity.dynamic.physics.KinematicState;
import pacman.model.entity.dynamic.physics.Vector2D;

public class Inky extends GhostImpl {

    public Inky(GhostStrategy ghostStrategy, Image image, BoundingBox boundingBox, KinematicState kinematicState,
            GhostMode ghostMode, Vector2D targetCorner) {
        super(ghostStrategy, image, boundingBox, kinematicState, ghostMode, targetCorner);
    }
    
    
}
