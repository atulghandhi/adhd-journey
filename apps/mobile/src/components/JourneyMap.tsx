import { Path, Svg } from "react-native-svg";

import { JourneyMapNode } from "./JourneyMapNode";
import { View } from "./primitives";
import {
  getJourneyMapConnectorPath,
  getJourneyMapNodePosition,
} from "./journeyMapUtils";

import type { JourneyState } from "@focuslab/shared";

interface JourneyMapProps {
  justUnlockedTaskIds?: string[];
  onSelectTask?: (taskId: string) => void;
  onVisibleActiveNode?: (y: number) => void;
  state: JourneyState;
}

export function JourneyMap({
  justUnlockedTaskIds = [],
  onSelectTask,
  onVisibleActiveNode,
  state,
}: JourneyMapProps) {
  return (
    <View className="gap-0">
      {state.tasks.map((item, index) => {
        const position = getJourneyMapNodePosition(index);
        const nextItem = state.tasks[index + 1];
        const nextPosition = nextItem
          ? getJourneyMapNodePosition(index + 1)
          : null;
        const connectorUnlocked = item.isCompleted || nextItem?.isActive;

        return (
          <View key={item.task.id}>
            <JourneyMapNode
              canOpen={item.canOpen}
              isActive={item.isActive}
              isCompleted={item.isCompleted}
              interactionType={item.task.interaction_type}
              isLocked={item.isLocked}
              justUnlocked={justUnlockedTaskIds.includes(item.task.id)}
              onActiveLayout={onVisibleActiveNode}
              onPress={() => onSelectTask?.(item.task.id)}
              order={item.task.order}
              position={position}
              subtitle={item.subtitle}
              title={item.task.title}
            />
            {nextPosition ? (
              <View className="h-16 w-full">
                <Svg height="64" viewBox="0 0 100 72" width="100%">
                  <Path
                    d={getJourneyMapConnectorPath(position, nextPosition)}
                    fill="none"
                    stroke={connectorUnlocked ? "#40916C" : "#B7E4C7"}
                    strokeDasharray={connectorUnlocked ? undefined : "4,4"}
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </Svg>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
