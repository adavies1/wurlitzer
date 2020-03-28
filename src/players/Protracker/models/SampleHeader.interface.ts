export interface SampleHeader {
    name:         string; // Max 22 chars
    length:       number; // Be careful - this is the length protracker tells you. You actually have length + 1 samples!
    fineTune:     number; // Between -7 and +7 inclusive
    volume:       number; // Between 0 and 64 inclusive
    repeatOffset: number;
    repeatLength: number; // This is in 'wave sections', so a length of 8 would need 9 samples [0]-[8]
}
